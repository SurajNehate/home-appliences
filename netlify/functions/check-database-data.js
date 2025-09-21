'use strict';

exports.handler = async (event) => {
  try {
    const NETLIFY_DATABASE_URL = process.env.NETLIFY_DATABASE_URL;
    
    if (!NETLIFY_DATABASE_URL) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'NETLIFY_DATABASE_URL not found' })
      };
    }

    // Use direct PostgreSQL connection to check data
    const { Client } = require('pg');
    const client = new Client({
      connectionString: NETLIFY_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const results = {};

    try {
      // Check users table
      const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
      results.users = {
        count: parseInt(usersResult.rows[0].count),
        sample: []
      };

      if (results.users.count > 0) {
        const sampleUsers = await client.query('SELECT id, name, email, role, created_at FROM users LIMIT 5');
        results.users.sample = sampleUsers.rows;
      }
    } catch (err) {
      results.users = { error: err.message };
    }

    try {
      // Check products table
      const productsResult = await client.query('SELECT COUNT(*) as count FROM products');
      results.products = {
        count: parseInt(productsResult.rows[0].count)
      };
    } catch (err) {
      results.products = { error: err.message };
    }

    try {
      // Check what tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      results.tables = tablesResult.rows.map(row => row.table_name);
    } catch (err) {
      results.tables = { error: err.message };
    }

    try {
      // Check database roles
      const rolesResult = await client.query(`
        SELECT rolname 
        FROM pg_roles 
        WHERE rolname IN ('authenticated', 'anonymous', 'rest_user', 'neondb_owner')
        ORDER BY rolname
      `);
      results.roles = rolesResult.rows.map(row => row.rolname);
    } catch (err) {
      results.roles = { error: err.message };
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Database data check completed',
        data: results,
        recommendation: results.users?.count > 0 ? 
          'WARNING: You have user data! Disabling Auth will DELETE this data.' :
          'Safe to disable Auth - no user data found.'
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) })
    };
  }
};