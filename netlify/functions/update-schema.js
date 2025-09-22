'use strict';
const { Client } = require('pg');

async function getDbClient() {
  const connectionString = process.env.NEON_DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  const client = new Client({
    connectionString,
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

    // Ensure products table columns align with direct functions (image_url, images[])
    try {
      // Create table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          price NUMERIC NOT NULL,
          category TEXT NOT NULL,
          description TEXT NOT NULL,
          status BOOLEAN NOT NULL DEFAULT TRUE,
          image_url TEXT,
          images TEXT[],
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      // Ensure columns exist
      await client.query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS images TEXT[],
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      `);
      // Remove old experimental columns if present
      await client.query(`
        ALTER TABLE products
        DROP COLUMN IF EXISTS image_data,
        DROP COLUMN IF EXISTS additional_images;
      `);
      results.push({ action: 'Ensure products schema', success: true });
    } catch (err) {
      results.push({ action: 'Ensure products schema', success: false, error: err.message });
    }

    // Ensure users table (password, timestamps) and migrate legacy password_hash
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'member',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      // Add/align columns
      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS password TEXT,
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member',
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      `);
      // Migrate from legacy password_hash to password if present
      await client.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'password_hash'
          ) THEN
            UPDATE users SET password = COALESCE(password, password_hash);
            ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
          END IF;
        END$$;
      `);
      results.push({ action: 'Ensure users schema', success: true });
    } catch (err) {
      results.push({ action: 'Ensure users schema', success: false, error: err.message });
    }

    // Ensure orders table exists matching orders-direct.ts
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          address TEXT NOT NULL,
          phone TEXT NOT NULL,
          items JSONB NOT NULL,
          total NUMERIC NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      results.push({ action: 'Ensure orders schema', success: true });
    } catch (err) {
      results.push({ action: 'Ensure orders schema', success: false, error: err.message });
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Database schema update completed', results })
    };

  } catch (err) {
    if (client) {
      try { await client.end(); } catch (_) {}
    }
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
