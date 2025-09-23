import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

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

const ensureOrders = async (sql: ReturnType<typeof neon>) => {
  // Align with schema: orders + order_items normalized
  await sql`
    create table if not exists orders (
      id serial primary key,
      user_id integer,
      customer_name text not null,
      customer_email text,
      customer_phone text,
      customer_address text,
      total numeric(10,2) not null,
      status text not null default 'new',
      created_at timestamptz not null default now()
    );
  `;
  await sql`
    create table if not exists order_items (
      id serial primary key,
      order_id integer not null references orders(id) on delete cascade,
      product_id integer,
      name text not null,
      price numeric(10,2) not null,
      qty integer not null,
      image_url text
    );
  `;
};

const verify = (token?: string) => {
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET_NOT_SET');
  try { return jwt.verify(token, secret) as any; } catch { return null; }
};

export const handler: Handler = async (event) => {
  const method = event.httpMethod.toUpperCase();
  const id = event.queryStringParameters?.id ? Number(event.queryStringParameters.id) : undefined;

  try {
    const sql = getSql();
    await ensureOrders(sql);

    if (method === 'POST') {
      // Guest checkout supported; user_id filled if logged in
      const payload = event.body ? JSON.parse(event.body) : {};
      const { name, email, address, phone, items, total } = payload;
      if (!name || !Array.isArray(items) || items.length === 0 || total == null) return bad('MISSING_FIELDS', 400);

      const orderRows = await sql<any[]>`
        insert into orders (user_id, customer_name, customer_email, customer_phone, customer_address, total, status)
        values (null, ${name}, ${email || ''}, ${phone || ''}, ${address || ''}, ${total}, 'new')
        returning id
      `;
      const orderId = orderRows[0].id as number;

      for (const [i, it] of (items as any[]).entries()) {
        await sql`
          insert into order_items(order_id, product_id, name, price, qty, image_url)
          values (${orderId}, ${it.id || null}, ${it.name || ''}, ${Number(it.price || 0)}, ${Number(it.qty || 0)}, ${it.imageUrl || null})
        `;
      }

      return ok({ id: orderId }, 201);
    }

    if (method === 'GET') {
      const auth = event.headers['authorization'] || event.headers['Authorization'];
      const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
      const decoded = verify(token);
      if (!decoded || decoded.role !== 'admin') return bad('UNAUTHORIZED', 401);

      if (id) {
        const rows = await sql<any[]>`
          select o.id, o.customer_name as name, o.customer_email as email, o.customer_phone as phone, o.customer_address as address,
                 o.total, o.status, o.created_at,
                 coalesce(json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'name', oi.name, 'price', oi.price, 'qty', oi.qty, 'image_url', oi.image_url) order by oi.id)
                          filter (where oi.id is not null), '[]'::json) as items
          from orders o
          left join order_items oi on o.id = oi.order_id
          where o.id = ${id}
          group by o.id
        `;
        return ok(rows[0] || null);
      }

      const rows = await sql<any[]>`
        select o.id, o.customer_name as name, o.customer_email as email, o.customer_phone as phone, o.customer_address as address,
               o.total, o.status, o.created_at,
               coalesce(json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'name', oi.name, 'price', oi.price, 'qty', oi.qty, 'image_url', oi.image_url) order by oi.id)
                        filter (where oi.id is not null), '[]'::json) as items
        from orders o
        left join order_items oi on o.id = oi.order_id
        group by o.id
        order by o.id desc
      `;
      return ok(rows);
    }

    return bad('METHOD_NOT_ALLOWED', 405);
  } catch (err) {
    console.error('orders-direct error:', err);
    const msg = (err as Error).message || 'INTERNAL_ERROR';
    const code = msg.includes('NOT_SET') ? 500 : 500;
    return { statusCode: code, body: JSON.stringify({ error: msg }) };
  }
};
