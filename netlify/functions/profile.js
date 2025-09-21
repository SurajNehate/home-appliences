'use strict';
const { getAuthClaims, neonFetch } = require('./utils');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
    const claims = getAuthClaims(event);
    if (!claims) return { statusCode: 401, body: 'Unauthorized' };
    const rows = await neonFetch(`/users?select=id,name,email,phone,role&id=eq.${claims.sub}`);
    const user = Array.isArray(rows) ? rows[0] : null;
    return { statusCode: 200, body: JSON.stringify({ user }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};