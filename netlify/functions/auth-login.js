'use strict';
const { neonFetch } = require('./utils');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const payload = JSON.parse(event.body || '{}');
    const { email, password } = payload;
    if (!email || !password) return { statusCode: 400, body: 'Missing credentials' };

    const users = await neonFetch(`/users?email=eq.${encodeURIComponent(email)}&select=*`);
    const user = Array.isArray(users) ? users[0] : null;
    if (!user) return { statusCode: 401, body: 'Invalid email or password' };

    const ok = bcrypt.compareSync(String(password), String(user.password));
    if (!ok) return { statusCode: 401, body: 'Invalid email or password' };

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const safe = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
    return { statusCode: 200, body: JSON.stringify({ token, user: safe }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};