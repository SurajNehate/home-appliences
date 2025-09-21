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

function getAuthClaims(event) {
  const h = event.headers || {};
  const auth = h.authorization || h.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_) {
    return null;
  }
}

exports.handler = async (event) => {
  let client;
  try {
    const method = event.httpMethod;
    
    // Check authentication for all operations
    const claims = getAuthClaims(event);
    if (!claims) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
    }

    client = await getDbClient();

    if (method === 'POST') {
      // Upload/Update images for a product
      const payload = JSON.parse(event.body || '{}');
      const { productId, imageData, additionalImages } = payload;
      
      if (!productId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing productId' }) };
      }

      // Clean base64 data (remove data URL prefix)
      const mainImage = imageData ? imageData.replace(/^data:image\/[a-z]+;base64,/, '') : null;
      const cleanAdditionalImages = Array.isArray(additionalImages) ?
        additionalImages.map(img => img.replace(/^data:image\/[a-z]+;base64,/, '')) : [];

      // Update product with new image data
      const updateQuery = `
        UPDATE products 
        SET image_data = $1, additional_images = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [
        mainImage,
        cleanAdditionalImages,
        productId
      ]);

      if (result.rows.length === 0) {
        await client.end();
        return { statusCode: 404, body: JSON.stringify({ error: 'Product not found' }) };
      }

      const product = result.rows[0];
      const responseProduct = {
        ...product,
        imageUrl: product.image_data ? `data:image/jpeg;base64,${product.image_data}` : null,
        images: product.additional_images ? product.additional_images.map(img => `data:image/jpeg;base64,${img}`) : []
      };

      await client.end();
      return { statusCode: 200, body: JSON.stringify(responseProduct) };
    }

    if (method === 'DELETE') {
      // Clear images from a product
      const params = event.queryStringParameters || {};
      const { productId } = params;
      
      if (!productId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing productId' }) };
      }

      const result = await client.query(
        'UPDATE products SET image_data = NULL, additional_images = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [productId]
      );
      
      await client.end();
      return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  } catch (err) {
    if (client) {
      try { await client.end(); } catch (_) {}
    }
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};