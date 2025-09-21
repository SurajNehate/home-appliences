'use strict';
const { Client } = require('pg');

exports.handler = async (event) => {
  try {
    const NETLIFY_DATABASE_URL = process.env.NETLIFY_DATABASE_URL;
    
    if (!NETLIFY_DATABASE_URL) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'NETLIFY_DATABASE_URL not configured' })
      };
    }

    const client = new Client({
      connectionString: NETLIFY_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Test basic queries
    const results = [];

    try {
      // Test 1: Check if we can query users table
      const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
      results.push({
        test: 'Count users',
        success: true,
        result: `Found ${usersResult.rows[0].count} users`
      });
    } catch (err) {
      results.push({
        test: 'Count users',
        success: false,
        error: err.message
      });
    }

    try {
      // Test 2: Check if we can query products table
      const productsResult = await client.query('SELECT COUNT(*) as count FROM products');
      results.push({
        test: 'Count products',
        success: true,
        result: `Found ${productsResult.rows[0].count} products`
      });
    } catch (err) {
      results.push({
        test: 'Count products',
        success: false,
        error: err.message
      });
    }

    try {
      // Test 3: Try to fetch some products
      const productsData = await client.query('SELECT id, name, price FROM products LIMIT 3');
      results.push({
        test: 'Fetch products data',
        success: true,
        result: `Retrieved ${productsData.rows.length} products`,
        data: productsData.rows
      });
    } catch (err) {
      results.push({
        test: 'Fetch products data',
        success: false,
        error: err.message
      });
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Direct PostgreSQL connection test completed',
        results: results,
        conclusion: results.some(r => r.success) ? 
          'SUCCESS: Direct PostgreSQL works! We can bypass the REST API.' :
          'FAILED: Direct PostgreSQL connection also has issues.'
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: String(err),
        message: 'Failed to establish direct PostgreSQL connection'
      })
    };
  }
};