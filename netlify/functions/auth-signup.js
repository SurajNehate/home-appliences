'use strict';
const { neonFetch } = require('./utils');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const payload = JSON.parse(event.body || '{}');
    const { name, email, password, phone, role } = payload;
    if (!name || !email || !password) return { statusCode: 400, body: 'Missing required fields' };

    const password_hash = bcrypt.hashSync(String(password), 10);
    const body = await neonFetch(`/users`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password: password_hash, phone: phone || '', role: role || 'member' })
    });
    // Remove password before returning
    const safe = (body || []).map(u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role }));
    return { statusCode: 200, body: JSON.stringify(safe) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};