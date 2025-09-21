'use strict';
const { requireAdmin } = require('./utils');
const { Client } = require('pg');

async function getDbClient() {
  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

// Accepts JSON: { product_id, filename, content_type, data_base64 }
// Returns: { id, url }
exports.handler = async (event) => {
  let client;
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    // Require admin (app JWT, independent of Neon REST)
    requireAdmin(event);

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch (_) { body = {}; }
    const { product_id, filename, content_type, data_base64 } = body;
    if (!data_base64) return { statusCode: 400, body: 'Missing data_base64' };

    const bin = Buffer.from(String(data_base64), 'base64');
    const size = bin.length;

    client = await getDbClient();
    const result = await client.query(
      `INSERT INTO product_images_bin (product_id, filename, content_type, bytes, size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [product_id || null, filename || null, content_type || 'application/octet-stream', bin, size]
    );

    const created = result.rows && result.rows[0];
    if (!created) return { statusCode: 500, body: 'Insert failed' };

    const url = `/.netlify/functions/image?id=${created.id}`;

    await client.end();
    return { statusCode: 200, body: JSON.stringify({ id: created.id, url }) };
  } catch (err) {
    if (client) { try { await client.end(); } catch (_) {} }
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
