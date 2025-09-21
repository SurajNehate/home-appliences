'use strict';
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

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

    // Create admin user
    try {
      const adminExists = await client.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
      
      if (adminExists.rows.length === 0) {
        const adminPassword = bcrypt.hashSync('admin123', 10);
        const adminResult = await client.query(`
          INSERT INTO users (name, email, password, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, email, role
        `, ['Admin User', 'admin@example.com', adminPassword, 'admin']);
        
        results.push({
          action: 'Create Admin User',
          success: true,
          data: adminResult.rows[0]
        });
      } else {
        results.push({
          action: 'Create Admin User',
          success: true,
          message: 'Admin user already exists'
        });
      }
    } catch (err) {
      results.push({
        action: 'Create Admin User',
        success: false,
        error: err.message
      });
    }

    // Create test member
    try {
      const memberExists = await client.query('SELECT id FROM users WHERE email = $1', ['user@example.com']);
      
      if (memberExists.rows.length === 0) {
        const memberPassword = bcrypt.hashSync('user123', 10);
        const memberResult = await client.query(`
          INSERT INTO users (name, email, password, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, email, role
        `, ['Test User', 'user@example.com', memberPassword, 'member']);
        
        results.push({
          action: 'Create Member User',
          success: true,
          data: memberResult.rows[0]
        });
      } else {
        results.push({
          action: 'Create Member User',
          success: true,
          message: 'Member user already exists'
        });
      }
    } catch (err) {
      results.push({
        action: 'Create Member User',
        success: false,
        error: err.message
      });
    }

    // Create sample products
    try {
      const productExists = await client.query('SELECT id FROM products LIMIT 1');
      
      if (productExists.rows.length === 0) {
        const sampleProducts = [
          {
            name: 'Modern Curtains',
            price: 49.99,
            category: 'Curtains',
            description: 'Beautiful modern curtains for your home',
            image_url: 'https://via.placeholder.com/300x300?text=Curtains',
            images: ['https://via.placeholder.com/300x300?text=Curtains']
          },
          {
            name: 'LED Table Lamp',
            price: 29.99,
            category: 'Appliances',
            description: 'Energy-efficient LED table lamp',
            image_url: 'https://via.placeholder.com/300x300?text=Lamp',
            images: ['https://via.placeholder.com/300x300?text=Lamp']
          }
        ];

        for (const product of sampleProducts) {
          const productResult = await client.query(`
            INSERT INTO products (name, price, category, description, image_url, images)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, price, category
          `, [
            product.name,
            product.price,
            product.category,
            product.description,
            product.image_url,
            JSON.stringify(product.images)
          ]);

          results.push({
            action: 'Create Sample Product',
            success: true,
            data: productResult.rows[0]
          });
        }
      } else {
        results.push({
          action: 'Create Sample Products',
          success: true,
          message: 'Products already exist'
        });
      }
    } catch (err) {
      results.push({
        action: 'Create Sample Products',
        success: false,
        error: err.message
      });
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Test data setup completed',
        results: results,
        testCredentials: {
          admin: { email: 'admin@example.com', password: 'admin123' },
          member: { email: 'user@example.com', password: 'user123' }
        }
      })
    };

  } catch (err) {
    if (client) {
      try { await client.end(); } catch (_) {}
    }
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};