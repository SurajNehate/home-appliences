import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const ok = (body: unknown, statusCode = 200) => ({ statusCode, body: JSON.stringify(body) });
const bad = (message: string, statusCode = 400) => ({ statusCode, body: JSON.stringify({ error: message }) });

const getSql = () => {
  const connStr = process.env.NEON_DATABASE_URL;
  if (!connStr) throw new Error('NEON_DATABASE_URL_NOT_SET');
  return neon(connStr);
};

const verify = (token?: string) => {
  if (!token) throw new Error('NO_TOKEN');
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET_NOT_SET');
  const decoded = jwt.verify(token, secret) as any;
  if (decoded.role !== 'admin') throw new Error('UNAUTHORIZED');
  return decoded;
};

const ensureProducts = async (sql: ReturnType<typeof neon>) => {
  // Align with schema: images JSONB, optional product_images for ordering
  await sql`
    create table if not exists products (
      id serial primary key,
      name text not null,
      price numeric(10,2) not null,
      image_url text,
      images jsonb not null default '[]'::jsonb,
      category text,
      description text,
      status boolean not null default true,
      created_at timestamptz not null default now()
    );
  `;
  await sql`
    create table if not exists product_images (
      id serial primary key,
      product_id integer not null references products(id) on delete cascade,
      url text not null,
      sort_order integer not null default 0
    );
  `;
};

const mapProductRow = (row: any) => {
  const pi = Array.isArray(row.product_images) ? row.product_images : [];
  const imagesJson = row.images_jsonb;
  const images = Array.isArray(imagesJson) && imagesJson.length ? imagesJson : (Array.isArray(pi) ? pi.map((x: any) => x.url) : []);
  const imageUrl = row.image_url || (Array.isArray(pi) && pi[0] ? pi[0].url : null);
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    description: row.description,
    status: row.status,
    imageUrl,
    images,
    created_at: row.created_at,
  };
};

export const handler: Handler = async (event) => {
  const method = event.httpMethod.toUpperCase();
  const id = event.queryStringParameters?.id ? Number(event.queryStringParameters.id) : undefined;

  let payload: any = undefined;
  if (event.body) {
    try { payload = JSON.parse(event.body); } catch { return bad('INVALID_JSON', 400); }
  }

  try {
    const sql = getSql();
    await ensureProducts(sql);

    if (method === 'GET') {
      if (id) {
        const rows = await sql<any[]>`
          select p.id, p.name, p.price, p.category, p.description, p.status, p.image_url, p.images as images_jsonb, p.created_at,
                 coalesce(
                   json_agg(json_build_object('url', pi.url, 'sort_order', pi.sort_order) order by pi.sort_order)
                   filter (where pi.url is not null),
                   '[]'::json
                 ) as product_images
          from products p
          left join product_images pi on p.id = pi.product_id
          where p.id = ${id}
          group by p.id
        `;
        const row = rows[0];
        return ok(row ? mapProductRow(row) : null);
      }
      const rows = await sql<any[]>`
        select p.id, p.name, p.price, p.category, p.description, p.status, p.image_url, p.images as images_jsonb, p.created_at,
               coalesce(
                 json_agg(json_build_object('url', pi.url, 'sort_order', pi.sort_order) order by pi.sort_order)
                 filter (where pi.url is not null),
                 '[]'::json
               ) as product_images
        from products p
        left join product_images pi on p.id = pi.product_id
        group by p.id
        order by p.id desc
      `;
      return ok(rows.map(mapProductRow));
    }

    if (method === 'POST') {
      const auth = event.headers['authorization'] || event.headers['Authorization'];
      const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
      verify(token);
      const { name, price, category, description, status = true, imageUrl = null, images = [] } = payload || {};
      if (!name || price == null || !category || !description) return bad('MISSING_FIELDS', 400);
      const imagesJson = Array.isArray(images) ? JSON.stringify(images) : '[]';
      const rows = await sql<any[]>`
        insert into products(name, price, image_url, images, category, description, status)
        values (${name}, ${price}, ${imageUrl}, ${imagesJson}::jsonb, ${category}, ${description}, ${status})
        returning id, name, price, category, description, status, image_url, images as images_jsonb, created_at
      `;
      const row = rows[0];
      return ok(mapProductRow(row), 201);
    }

    if (method === 'PUT') {
      if (!id) return bad('ID_REQUIRED', 400);
      const auth = event.headers['authorization'] || event.headers['Authorization'];
      const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
      verify(token);
      const { name, price, category, description, status, imageUrl, images } = payload || {};
      const imagesJson = Array.isArray(images) ? JSON.stringify(images) : null;
      const rows = await sql<any[]>`
        update products set
          name = coalesce(${name}, name),
          price = coalesce(${price}, price),
          category = coalesce(${category}, category),
          description = coalesce(${description}, description),
          status = coalesce(${status}, status),
          image_url = coalesce(${imageUrl}, image_url),
          images = coalesce(${imagesJson}::jsonb, images)
        where id = ${id}
        returning id, name, price, category, description, status, image_url, images as images_jsonb, created_at
      `;
      const row = rows[0];
      return ok(row ? mapProductRow(row) : null);
    }

    if (method === 'DELETE') {
      if (!id) return bad('ID_REQUIRED', 400);
      const auth = event.headers['authorization'] || event.headers['Authorization'];
      const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
      verify(token);
      await sql`delete from products where id = ${id}`;
      return ok({ ok: true });
    }

    return bad('METHOD_NOT_ALLOWED', 405);
  } catch (err) {
    console.error('products-direct error:', err);
    const msg = (err as Error).message || 'INTERNAL_ERROR';
    const code = msg.includes('UNAUTHORIZED') || msg.includes('NO_TOKEN') ? 401 : (msg.includes('NOT_SET') ? 500 : 500);
    return { statusCode: code, body: JSON.stringify({ error: msg }) };
  }
};
