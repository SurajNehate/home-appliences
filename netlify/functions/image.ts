import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

export const handler: Handler = async (event) => {
  try {
    const idParam = event.queryStringParameters?.id;
    const id = idParam ? Number(idParam) : NaN;
    if (!id || Number.isNaN(id)) {
      return { statusCode: 400, body: 'IMAGE_ID_REQUIRED' };
    }

    const connStr =
      process.env.NETLIFY_DATABASE_URL ||
      process.env.NEON_DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.NETLIFY_DATABASE_URL_UNPOOLED;
    if (!connStr) {
      return { statusCode: 500, body: 'NEON_DATABASE_URL_NOT_SET' };
    }
    const sql = neon(connStr);

    const rows = await sql<{ content_type: string; bytes: Uint8Array }[]>`
      select content_type, bytes from product_images_bin where id = ${id}
    `;
    const row = rows[0];
    if (!row) return { statusCode: 404, body: 'NOT_FOUND' };

    const contentType = row.content_type || 'application/octet-stream';
    const bytes = row.bytes as Uint8Array;
    const base64 = Buffer.from(bytes).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
      isBase64Encoded: true,
      body: base64,
    };
  } catch (err) {
    console.error('image function error:', err);
    return { statusCode: 500, body: 'INTERNAL_ERROR' };
  }
};
