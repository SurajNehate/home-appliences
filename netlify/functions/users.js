'use strict';
const { neonFetch } = require('./utils');

exports.handler = async (event) => {
  try {
    const method = event.httpMethod;
    const params = event.queryStringParameters || {};
    const id = params.id ? Number(params.id) : undefined;

    if (method === 'GET') {
      const { requireAdmin } = require('./utils');
      requireAdmin(event);
      const filters = [];
      if (id) filters.push(`id=eq.${id}`);
      if (params.email) filters.push(`email=eq.${encodeURIComponent(params.email)}`);
      let path = `/users?select=*`;
      if (filters.length) path += `&${filters.join('&')}`;
      const data = await neonFetch(path, { method: 'GET' });
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    if (method === 'POST') {
      // For user creation use auth-signup; this path reserved for admin
      const { requireAdmin } = require('./utils');
      requireAdmin(event);
      const payload = JSON.parse(event.body || '{}');
      const body = await neonFetch(`/users`, { method: 'POST', body: JSON.stringify(payload) });
      return { statusCode: 200, body: JSON.stringify(body) };
    }

    if (method === 'PUT' || method === 'PATCH') {
      const { requireAdmin } = require('./utils');
      requireAdmin(event);
      if (!id) return { statusCode: 400, body: 'Missing id' };
      const updates = JSON.parse(event.body || '{}');
      const body = await neonFetch(`/users?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
      return { statusCode: 200, body: JSON.stringify(body) };
    }

    if (method === 'DELETE') {
      const { requireAdmin } = require('./utils');
      requireAdmin(event);
      if (!id) return { statusCode: 400, body: 'Missing id' };
      const body = await neonFetch(`/users?id=eq.${id}`, { method: 'DELETE' });
      return { statusCode: 200, body: JSON.stringify(body) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};