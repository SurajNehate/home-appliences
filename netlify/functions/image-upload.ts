import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

const ok = (body: unknown, statusCode = 200) => ({ statusCode, body: JSON.stringify(body) });
const bad = (message: string, statusCode = 400) => ({ statusCode, body: JSON.stringify({ error: message }) });

const getSql = () => {
  const connStr = process.env.NEON_DATABASE_URL;
  if (!connStr) throw new Error('NEON_DATABASE_URL_NOT_SET');
  return neon(connStr);
};

function parseDataUrl(dataUrl: string): { contentType: string; buffer: Buffer } | null {
  try {
    const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!match) return null;
    const contentType = match[1] || 'application/octet-stream';
    const base64 = match[2];
    const buffer = Buffer.from(base64, 'base64');
    return { contentType, buffer };
  } catch {
    return null;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod.toUpperCase() !== 'POST') {
    return bad('METHOD_NOT_ALLOWED', 405);
  }
  try {
    // Require admin JWT for image updates
    const auth = event.headers['authorization'] || event.headers['Authorization'];
    const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET_NOT_SET');
    const decoded: any = token ? (await import('jsonwebtoken')).default.verify(token, secret) : null;
    if (!decoded || decoded.role !== 'admin') return bad('UNAUTHORIZED', 401);

    const payload = event.body ? JSON.parse(event.body) : {};
    const productId: number = payload.productId;
    const imageData: string | undefined = payload.imageData;      // base64 data URL of main image
    const additionalImages: (string | undefined)[] = payload.additionalImages || []; // base64 data URLs
    if (!productId) return bad('PRODUCT_ID_REQUIRED', 400);

    const sql = getSql();

    const urls: string[] = [];

    async function storeOne(dataUrl: string, index: number) {
      const parsed = parseDataUrl(dataUrl);
      if (!parsed) return null;
      const { contentType, buffer } = parsed;
      const filename = `product_${productId}_${Date.now()}_${index}`;
      const rows = await sql<{ id: number }[]>`
        insert into product_images_bin(product_id, filename, content_type, bytes, size)
        values (${productId}, ${filename}, ${contentType}, ${buffer}, ${buffer.length})
        returning id
      `;
      const id = rows[0]?.id;
      return typeof id === 'number' ? id : null;
    }

    // Main image first (if provided)
    let mainId: number | null = null;
    if (imageData) {
      mainId = await storeOne(imageData, 0);
      if (mainId) urls.push(`/.netlify/functions/image?id=${mainId}`);
    }

    // Additional images (if provided)
    let i = 1;
    for (const img of additionalImages) {
      if (!img) continue;
      const id = await storeOne(img, i++);
      if (id) urls.push(`/.netlify/functions/image?id=${id}`);
    }

    // Update products: image_url to main (if present), images JSONB to full list (replace semantics)
    if (urls.length) {
      await sql`update products set image_url = ${urls[0]} where id = ${productId}`;
      await sql`update products set images = ${JSON.stringify(urls)}::jsonb where id = ${productId}`;
    }

    // Return latest product row with images JSONB
    const rows = await sql<any[]>`
      select p.id, p.name, p.price, p.category, p.description, p.status, p.image_url, p.images as images_jsonb, p.created_at
      from products p where p.id = ${productId}
    `;
    const row = rows[0] || null;
    const mapped = row ? {
      id: row.id,
      name: row.name,
      price: Number(row.price),
      category: row.category,
      description: row.description,
      status: row.status,
      imageUrl: row.image_url,
      images: Array.isArray(row.images_jsonb) ? row.images_jsonb : [],
      created_at: row.created_at,
    } : null;

    return ok(mapped, 201);
  } catch (err) {
    console.error('image-upload error:', err);
    const msg = (err as Error).message || 'INTERNAL_ERROR';
    return { statusCode: 500, body: JSON.stringify({ error: msg }) };
  }
};
