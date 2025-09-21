'use strict';
const { neonFetch } = require('./utils');

// Optional runtime image processing
let sharp;
try {
  sharp = require('sharp');
} catch (_) {
  // sharp is optional; if not available, we serve the original bytes
  sharp = null;
}

// GET /.netlify/functions/image?id=123[&w=800&h=600&fit=cover&fmt=webp&q=80]
// Streams the image as binary with correct content-type, optionally transformed
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
    const qs = event.queryStringParameters || {};
    const id = qs.id;
    if (!id) return { statusCode: 400, body: 'Missing id' };

    const rows = await neonFetch(`/product_images_bin?select=bytes,content_type,filename&id=eq.${id}`);
    const r = Array.isArray(rows) ? rows[0] : null;
    if (!r) return { statusCode: 404, body: 'Not Found' };

    const hex = String(r.bytes || '');
    let buf = hex && hex.startsWith('\\x') ? Buffer.from(hex.slice(2), 'hex') : Buffer.from([]);

    let contentType = r.content_type || 'application/octet-stream';
    let filename = (r.filename || 'image').replace(/"/g,'');

    // Transform if requested and sharp is available
    const w = qs.w ? parseInt(qs.w, 10) : undefined;
    const h = qs.h ? parseInt(qs.h, 10) : undefined;
    const fit = (qs.fit || 'cover'); // cover|contain|fill|inside|outside
    const q = qs.q ? Math.max(1, Math.min(100, parseInt(qs.q, 10))) : 80;
    const fmt = (qs.fmt || '').toLowerCase(); // webp|jpeg|png|avif

    if (sharp && (w || h || fmt)) {
      let pipe = sharp(buf).rotate();
      if (w || h) pipe = pipe.resize({ width: w, height: h, fit: fit });
      if (fmt === 'webp') {
        pipe = pipe.webp({ quality: q });
        contentType = 'image/webp';
        if (!filename.toLowerCase().endsWith('.webp')) filename += '.webp';
      } else if (fmt === 'jpeg' || fmt === 'jpg') {
        pipe = pipe.jpeg({ quality: q, mozjpeg: true });
        contentType = 'image/jpeg';
        if (!filename.toLowerCase().match(/\.jpe?g$/)) filename += '.jpg';
      } else if (fmt === 'png') {
        pipe = pipe.png();
        contentType = 'image/png';
        if (!filename.toLowerCase().endsWith('.png')) filename += '.png';
      } else if (fmt === 'avif') {
        pipe = pipe.avif({ quality: Math.round(q / 2) });
        contentType = 'image/avif';
        if (!filename.toLowerCase().endsWith('.avif')) filename += '.avif';
      }
      buf = await pipe.toBuffer();
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      isBase64Encoded: true,
      body: buf.toString('base64')
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
