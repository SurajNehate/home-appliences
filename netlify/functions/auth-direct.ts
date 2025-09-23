import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const ok = (body: unknown, statusCode = 200) => ({ statusCode, body: JSON.stringify(body) });
const bad = (message: string, statusCode = 400) => ({ statusCode, body: JSON.stringify({ error: message }) });

const getSql = () => {
  const connStr =
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED;
  if (!connStr) throw new Error('NEON_DATABASE_URL_NOT_SET');
  return neon(connStr);
};

const ensureUsers = async (sql: ReturnType<typeof neon>) => {
  // Align with existing schema: password column (bcrypt hash), role default 'member'
  await sql`
    create table if not exists users (
      id serial primary key,
      name text not null,
      email text not null unique,
      password text not null,
      phone text,
      role text not null default 'member',
      created_at timestamptz not null default now()
    );
  `;
};

const sign = (payload: any) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET_NOT_SET');
  return jwt.sign(payload, secret, { expiresIn: '12h' });
};

const verify = (token?: string) => {
  if (!token) throw new Error('NO_TOKEN');
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET_NOT_SET');
  return jwt.verify(token, secret) as any;
};

export const handler: Handler = async (event) => {
  const method = event.httpMethod.toUpperCase();
  const action = event.queryStringParameters?.action;

  try {
    const sql = getSql();
    await ensureUsers(sql);

    if (method === 'POST') {
      const payload = event.body ? JSON.parse(event.body) : {};

      if (action === 'signup') {
        const { name, email, password, role } = payload;
        if (!name || !email || !password) return bad('MISSING_FIELDS', 400);
        const hash = await bcrypt.hash(String(password), 10);
        const rows = await sql<{ id: number; name: string; email: string; role: string }[]>`
          insert into users(name, email, password, role)
          values (${name}, ${email}, ${hash}, ${role || 'member'})
          on conflict (email) do nothing
          returning id, name, email, role
        `;
        if (rows.length === 0) return bad('EMAIL_EXISTS', 409);
        const user = rows[0];
        const token = sign({ sub: user.id, role: user.role });
        return ok({ token, user }, 201);
      }

      if (action === 'login') {
        const { email, password } = payload;
        if (!email || !password) return bad('MISSING_FIELDS', 400);
        // Query only existing columns; store bcrypt hash in users.password
        const rows = await sql<any[]>`
          select id, name, email, password, role from users where email = ${email}
        `;
        if (rows.length === 0) return bad('INVALID_CREDENTIALS', 401);
        const u = rows[0];
        const stored = u.password;
        const okPw = stored ? await bcrypt.compare(String(password), String(stored)) : false;
        if (!okPw) return bad('INVALID_CREDENTIALS', 401);
        const user = { id: u.id, name: u.name, email: u.email, role: u.role };
        const token = sign({ sub: user.id, role: user.role });
        return ok({ token, user });
      }

      return bad('UNKNOWN_ACTION', 400);
    }

    if (method === 'GET') {
      const auth = event.headers['authorization'] || event.headers['Authorization'];
      const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
      const decoded = verify(token);
      const rows = await sql<{ id: number; name: string; email: string; role: string }[]>`
        select id, name, email, role from users where id = ${decoded.sub}
      `;
      const user = rows[0] || null;
      if (!user) return bad('USER_NOT_FOUND', 404);
      return ok({ user });
    }

    return bad('METHOD_NOT_ALLOWED', 405);
  } catch (err) {
    console.error('auth-direct error:', err);
    const msg = (err as Error).message || 'INTERNAL_ERROR';
    const code = msg.includes('NOT_SET') ? 500 : 500;
    return { statusCode: code, body: JSON.stringify({ error: msg }) };
  }
};
