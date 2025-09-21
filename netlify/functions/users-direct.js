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
    const claims = getAuthClaims(event);

    client = await getDbClient();

    if (method === 'GET') {
      // Check if user is authenticated
      if (!claims) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
      }

      let query = 'SELECT id, name, email, phone, role, created_at FROM users';
      const conditions = [];
      const values = [];
      let paramIndex = 1;

      // Admin can see all users, regular users can only see themselves
      if (claims.role !== 'admin') {
        conditions.push(`id = $${paramIndex}`);
        values.push(claims.sub);
        paramIndex++;
      }

      // Add filters
      if (params.id) {
        if (claims.role !== 'admin' && parseInt(params.id) !== parseInt(claims.sub)) {
          return { statusCode: 403, body: JSON.stringify({ error: 'Access denied' }) };
        }
        conditions.push(`id = $${paramIndex}`);
        values.push(parseInt(params.id));
        paramIndex++;
      }

      if (params.email && claims.role === 'admin') {
        conditions.push(`email = $${paramIndex}`);
        values.push(params.email);
        paramIndex++;
      }

      if (params.role && claims.role === 'admin') {
        conditions.push(`role = $${paramIndex}`);
        values.push(params.role);
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ' ORDER BY id';

      const result = await client.query(query, values);
      await client.end();
      return { statusCode: 200, body: JSON.stringify(result.rows) };
    }

    if (method === 'POST') {
      // Create new user (admin only)
      if (!claims || claims.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required' }) };
      }

      const payload = JSON.parse(event.body || '{}');
      const { name, email, password, phone, role } = payload;

      if (!name || !email || !password) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const password_hash = bcrypt.hashSync(String(password), 10);

      const query = `
        INSERT INTO users (name, email, password, phone, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, phone, role, created_at
      `;

      const result = await client.query(query, [
        name,
        email,
        password_hash,
        phone || '',
        role || 'member'
      ]);

      await client.end();
      return { statusCode: 200, body: JSON.stringify(result.rows) };
    }

    if (method === 'PATCH' || method === 'PUT') {
      // Update user
      if (!claims) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
      }

      const userId = params.id ? parseInt(params.id) : claims.sub;
      
      // Users can only update themselves, admins can update anyone
      if (claims.role !== 'admin' && parseInt(userId) !== parseInt(claims.sub)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Access denied' }) };
      }

      const updates = JSON.parse(event.body || '{}');
      const allowedFields = ['name', 'email', 'phone'];
      if (claims.role === 'admin') {
        allowedFields.push('role');
      }

      const setClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key] !== undefined) {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No valid fields to update' }) };
      }

      values.push(userId);
      const query = `
        UPDATE users 
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING id, name, email, phone, role, created_at
      `;

      const result = await client.query(query, values);
      await client.end();
      return { statusCode: 200, body: JSON.stringify(result.rows) };
    }

    if (method === 'DELETE') {
      // Delete user (admin only)
      if (!claims || claims.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required' }) };
      }

      const userId = params.id;
      if (!userId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'User ID required' }) };
      }

      const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
      await client.end();
      return { statusCode: 200, body: JSON.stringify(result.rows) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  } catch (err) {
    if (client) {
      try { await client.end(); } catch (_) {}
    }
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};