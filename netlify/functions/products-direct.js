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
    const params = event.queryStringParameters || {};
    const id = params.id ? Number(params.id) : undefined;

    client = await getDbClient();

    if (method === 'GET') {
      let query = 'SELECT * FROM products';
      
      const conditions = [];
      const values = [];
      let paramIndex = 1;

      // Add filters
      if (id) {
        conditions.push(`id = $${paramIndex}`);
        values.push(id);
        paramIndex++;
      }

      if (params.category) {
        conditions.push(`category = $${paramIndex}`);
        values.push(params.category);
        paramIndex++;
      }

      if (params.search) {
        const searchTerm = `%${params.search.toLowerCase()}%`;
        conditions.push(`(LOWER(name) LIKE $${paramIndex} OR LOWER(description) LIKE $${paramIndex + 1})`);
        values.push(searchTerm, searchTerm);
        paramIndex += 2;
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ' ORDER BY id';

      const result = await client.query(query, values);
      
      // Map the data for frontend compatibility
      const data = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        price: row.price,
        category: row.category,
        description: row.description,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        // Convert base64 image data to data URL for frontend
        imageUrl: row.image_data ? `data:image/jpeg;base64,${row.image_data}` : null,
        images: row.additional_images ? row.additional_images.map(img => `data:image/jpeg;base64,${img}`) : []
      }));

      await client.end();
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    if (method === 'POST') {
      // Check authentication
      const claims = getAuthClaims(event);
      if (!claims || claims.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required' }) };
      }

      const payload = JSON.parse(event.body || '{}');
      
      // Extract base64 image data (remove data URL prefix if present)
      const mainImage = payload.imageData ? 
        payload.imageData.replace(/^data:image/[a-z]+;base64,/, '') : null;
      
      const additionalImages = Array.isArray(payload.additionalImages) ?
        payload.additionalImages.map(img => img.replace(/^data:image/[a-z]+;base64,/, '')) : [];

      // Insert product with base64 image data
      const productQuery = `
        INSERT INTO products (name, price, image_data, additional_images, category, description, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const productResult = await client.query(productQuery, [
        payload.name,
        payload.price,
        mainImage,
        additionalImages,
        payload.category,
        payload.description,
        payload.status !== undefined ? payload.status : true
      ]);

      const product = productResult.rows[0];

      // Format response
      const responseProduct = {
        ...product,
        imageUrl: product.image_data ? `data:image/jpeg;base64,${product.image_data}` : null,
        images: product.additional_images ? product.additional_images.map(img => `data:image/jpeg;base64,${img}`) : []
      };

      await client.end();
      return { statusCode: 200, body: JSON.stringify(responseProduct) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  } catch (err) {
    if (client) {
      try { await client.end(); } catch (_) {}
    }
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};