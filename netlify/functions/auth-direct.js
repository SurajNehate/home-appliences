'use strict';
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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
    const path = event.path;

    client = await getDbClient();

    // Handle signup: POST /auth-direct with action=signup
    if (method === 'POST' && (path.includes('signup') || event.queryStringParameters?.action === 'signup')) {
      const payload = JSON.parse(event.body || '{}');
      const { name, email, password, phone, role } = payload;
      
      if (!name || !email || !password) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
      }

      // Check if user already exists
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'User already exists' }) };
      }

      const password_hash = bcrypt.hashSync(String(password), 10);
      
      const result = await client.query(`
        INSERT INTO users (name, email, password, phone, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, phone, role, created_at
      `, [
        name,
        email,
        password_hash,
        phone || '',
        role || 'member'
      ]);

      const user = result.rows[0];
      const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      
      await client.end();
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          token, 
          user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
        }) 
      };
    }

    // Handle login: POST /auth-direct with action=login
    if (method === 'POST' && (path.includes('login') || event.queryStringParameters?.action === 'login')) {
      const payload = JSON.parse(event.body || '{}');
      const { email, password } = payload;
      
      if (!email || !password) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing credentials' }) };
      }

      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      
      if (!user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid email or password' }) };
      }

      const validPassword = bcrypt.compareSync(String(password), String(user.password));
      if (!validPassword) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid email or password' }) };
      }

      const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      const safeUser = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
      
      await client.end();
      return { 
        statusCode: 200, 
        body: JSON.stringify({ token, user: safeUser }) 
      };
    }

    // Handle GET request for user info (if authenticated)
    if (method === 'GET') {
      const authHeader = event.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      
      if (!token) {
        return { statusCode: 401, body: JSON.stringify({ error: 'No token provided' }) };
      }

      try {
        const claims = jwt.verify(token, JWT_SECRET);
        const result = await client.query(
          'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
          [claims.sub]
        );
        
        if (result.rows.length === 0) {
          return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        }

        await client.end();
        return { statusCode: 200, body: JSON.stringify({ user: result.rows[0] }) };
      } catch (err) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
      }
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  } catch (err) {
    if (client) {
      try { await client.end(); } catch (_) {}
    }
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};