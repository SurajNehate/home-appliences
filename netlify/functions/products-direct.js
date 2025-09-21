'use strict';
const { Client } = require('pg');

async function getDbClient() {
  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

exports.handler = async (event) => {
  let client;
  try {
    const method = event.httpMethod;
    const params = event.queryStringParameters || {};
    const id = params.id ? Number(params.id) : undefined;

    client = await getDbClient();

    if (method === 'GET') {
      let query = `
        SELECT p.*, 
               COALESCE(
                 json_agg(
                   json_build_object('url', pi.url, 'sort_order', pi.sort_order)
                   ORDER BY pi.sort_order
                 ) FILTER (WHERE pi.url IS NOT NULL),
                 '[]'::json
               ) as product_images
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
      `;
      
      const conditions = [];
      const values = [];
      let paramIndex = 1;

      // Add filters
      if (id) {
        conditions.push(`p.id = $${paramIndex}`);
        values.push(id);
        paramIndex++;
      }

      if (params.category) {
        conditions.push(`p.category = $${paramIndex}`);
        values.push(params.category);
        paramIndex++;
      }

      if (params.search) {
        const searchTerm = `%${params.search.toLowerCase()}%`;
        conditions.push(`(LOWER(p.name) LIKE $${paramIndex} OR LOWER(p.description) LIKE $${paramIndex + 1})`);
        values.push(searchTerm, searchTerm);
        paramIndex += 2;
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ' GROUP BY p.id ORDER BY p.id';

      const result = await client.query(query, values);
      
      // Map the data for frontend compatibility
      const data = result.rows.map(row => ({
        ...row,
        images: Array.isArray(row.images) && row.images.length > 0 
          ? row.images 
          : (Array.isArray(row.product_images) ? row.product_images.map(pi => pi.url) : []),
        imageUrl: row.image_url || (Array.isArray(row.product_images) && row.product_images[0] ? row.product_images[0].url : null)
      }));

      await client.end();
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    if (method === 'POST') {
      // Simple admin check - you can enhance this
      const authHeader = event.headers.authorization || '';
      if (!authHeader.includes('Bearer')) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Admin access required' }) };
      }

      const payload = JSON.parse(event.body || '{}');
      const images = Array.isArray(payload.images) ? payload.images : [];
      const image_url = payload.image_url || payload.imageUrl || images[0] || null;

      // Insert product
      const productQuery = `
        INSERT INTO products (name, price, image_url, images, category, description, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const productResult = await client.query(productQuery, [
        payload.name,
        payload.price,
        image_url,
        JSON.stringify(images),
        payload.category,
        payload.description,
        payload.status !== undefined ? payload.status : true
      ]);

      const product = productResult.rows[0];

      // Insert product images
      if (images.length > 0) {
        const imageInserts = images.map((url, index) => 
          `(${product.id}, '${url}', ${index})`
        ).join(',');
        
        await client.query(`
          INSERT INTO product_images (product_id, url, sort_order)
          VALUES ${imageInserts}
        `);
      }

      await client.end();
      return { statusCode: 200, body: JSON.stringify([product]) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  } catch (err) {
    if (client) {
      try { await client.end(); } catch (_) {}
    }
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};