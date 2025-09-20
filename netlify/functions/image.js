'use strict';
const { neonFetch } = require('./utils');

// GET /.netlify/functions/image?id=123
// Streams the image as binary with correct content-type
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
    const id = event.queryStringParameters && event.queryStringParameters.id;
    if (!id) return { statusCode: 400, body: 'Missing id' };

    const rows = await neonFetch(`/product_images_bin?select=bytes,content_type,filename&id=eq.${id}`);
    const r = Array.isArray(rows) ? rows[0] : null;
    if (!r) return { statusCode: 404, body: 'Not Found' };

    const hex = String(r.bytes || '');
    const buf = hex && hex.startsWith('\\x') ? Buffer.from(hex.slice(2), 'hex') : Buffer.from([]);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': r.content_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${(r.filename || 'image').replace(/"/g,'')}"`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      isBase64Encoded: true,
      body: buf.toString('base64')
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
