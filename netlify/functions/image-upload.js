'use strict';
const { neonFetch } = require('./utils');

// Accepts JSON: { product_id, filename, content_type, data_base64 }
// Returns: { id, url }
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    // Require admin
    const { requireAdmin } = require('./utils');
    requireAdmin(event);

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch (_) { body = {}; }
    const { product_id, filename, content_type, data_base64 } = body;
    if (!data_base64) return { statusCode: 400, body: 'Missing data_base64' };
    const bin = Buffer.from(String(data_base64), 'base64');
    const hex = '\\x' + bin.toString('hex');
    const size = bin.length;

    const row = await neonFetch(`/product_images_bin`, {
      method: 'POST',
      body: JSON.stringify({ product_id: product_id || null, filename: filename || null, content_type: content_type || 'application/octet-stream', bytes: hex, size })
    });
    const created = Array.isArray(row) ? row[0] : null;
    if (!created) return { statusCode: 500, body: 'Insert failed' };

    const url = `/.netlify/functions/image?id=${created.id}`;
    return { statusCode: 200, body: JSON.stringify({ id: created.id, url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
