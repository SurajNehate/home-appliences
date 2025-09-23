import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

export const handler: Handler = async () => {
  const connStr =
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED;
  if (!connStr) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'NEON_DATABASE_URL_NOT_SET' }),
    };
  }
  try {
    const sql = neon(connStr);
    const rows = await sql`select 1 as ok`;
    const ok = Array.isArray(rows) && rows[0]?.ok === 1;
    return { statusCode: 200, body: JSON.stringify({ ok }) };
  } catch (err) {
    console.error('Netlify function DB health failed:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'DB_CONNECTION_FAILED' }),
    };
  }
};
