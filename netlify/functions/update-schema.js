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
    client = await getDbClient();

    const results = [];

    // Update products table to support base64 image storage
    try {
      await client.query(`
        ALTER TABLE products 
        DROP COLUMN IF EXISTS image_url,
        DROP COLUMN IF EXISTS images;
      `);
      
      await client.query(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS image_data TEXT,
        ADD COLUMN IF NOT EXISTS additional_images TEXT[];
      `);
      
      results.push({
        action: 'Update products table schema',
        success: true,
        message: 'Added image_data (TEXT) and additional_images (TEXT[]) columns'
      });
    } catch (err) {
      results.push({
        action: 'Update products table schema',
        success: false,
        error: err.message
      });
    }

    // Drop product_images table as we're storing images directly in products table
    try {
      await client.query(`DROP TABLE IF EXISTS product_images CASCADE;`);
      results.push({
        action: 'Drop product_images table',
        success: true,
        message: 'Removed separate product_images table'
      });
    } catch (err) {
      results.push({
        action: 'Drop product_images table',
        success: false,
        error: err.message
      });
    }

    // Ensure users table has the right structure
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      
      results.push({
        action: 'Update users table',
        success: true,
        message: 'Added timestamp columns'
      });
    } catch (err) {
      results.push({
        action: 'Update users table',
        success: false,
        error: err.message
      });
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Database schema update completed',
        results: results
      })
    };

  } catch (err) {
    if (client) {
      try { await client.end(); } catch (_) {}
    }
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};