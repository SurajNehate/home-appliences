'use strict';
const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function getDbClient() {
  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

function getClaims(event) {
  const h = event.headers || {};
  const auth = h.authorization || h.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch (_) { return null; }
}

exports.handler = async (event) => {
  let client;
  try {
    const method = event.httpMethod;
    const params = event.queryStringParameters || {};
    const claims = getClaims(event);

    client = await getDbClient();

    if (method === 'GET') {
      // Admin only
      if (!claims || claims.role !== 'admin') {
        await client.end();
        return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required' }) };
      }

      // Optional filters: id, status
      const conditions = [];
      const values = [];
      let idx = 1;
      if (params.id) { conditions.push(`o.id = $${idx++}`); values.push(parseInt(params.id)); }
      if (params.status) { conditions.push(`o.status = $${idx++}`); values.push(params.status); }

      let sql = `
        SELECT o.*, COALESCE(json_agg(oi ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]'::json) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
      `;
      if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
      sql += ' GROUP BY o.id ORDER BY o.id DESC';

      const res = await client.query(sql, values);
      await client.end();
      return { statusCode: 200, body: JSON.stringify(res.rows) };
    }

    if (method === 'POST') {
      // Guest checkout supported; user_id filled if logged in
      const body = JSON.parse(event.body || '{}');
      const customer = body.customer || {};
      const items = Array.isArray(body.items) ? body.items : [];
      if (!items.length) {
        await client.end();
        return { statusCode: 400, body: JSON.stringify({ error: 'No items' }) };
      }

      const total = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0);
      const user_id = claims ? parseInt(claims.sub) : null;

      const orderRes = await client.query(`
        INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, customer_address, total, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id
      `, [
        user_id || null,
        customer.name || '',
        customer.email || '',
        customer.phone || '',
        customer.address || '',
        total,
        'new'
      ]);

      const order = orderRes.rows[0];
      const orderId = order.id;

      const values = [];
      const placeholders = items.map((it, i) => {
        const base = i * 6;
        values.push(orderId, it.id || null, it.name || '', Number(it.price || 0), Number(it.qty || 0), it.imageUrl || null);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
      }).join(',');

      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, price, qty, image_url) VALUES ${placeholders}`,
        values
      );

      await client.end();
      return { statusCode: 200, body: JSON.stringify({ id: orderId }) };
    }

    if (method === 'DELETE') {
      // Admin only
      if (!claims || claims.role !== 'admin') {
        await client.end();
        return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required' }) };
      }
      const id = params.id ? parseInt(params.id) : undefined;
      if (!id) { await client.end(); return { statusCode: 400, body: JSON.stringify({ error: 'Missing id' }) }; }
      await client.query('DELETE FROM orders WHERE id = $1', [id]);
      await client.end();
      return { statusCode: 200, body: JSON.stringify([{ id }]) };
    }

    await client.end();
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (err) {
    if (client) { try { await client.end(); } catch (_) {} }
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};