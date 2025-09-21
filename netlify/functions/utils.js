'use strict';
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const NEON_REST_URL = process.env.NEON_REST_URL; // e.g. https://.../rest/v1
const NEON_API_KEY = process.env.NEON_API_KEY;   // Bearer token (preferred)
const NEON_BASIC_AUTH = process.env.NEON_BASIC_AUTH; // base64(username:password) if using basic auth
const NETLIFY_DATABASE_URL = process.env.NETLIFY_DATABASE_URL; // Connection string from Neon integration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function neonHeaders(extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extra,
  };
  
  // Try different authentication methods - prioritize API Key for Neon Auth
  if (NEON_API_KEY) {
    // Clean the API key of any whitespace
    const cleanApiKey = NEON_API_KEY.trim();
    headers['Authorization'] = `Bearer ${cleanApiKey}`;
  } else if (NEON_BASIC_AUTH) {
    headers['Authorization'] = `Basic ${NEON_BASIC_AUTH}`;
  } else if (NETLIFY_DATABASE_URL) {
    // Extract credentials from connection string
    try {
      const url = new URL(NETLIFY_DATABASE_URL);
      const username = url.username;
      const password = url.password;
      if (username && password) {
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }
    } catch (err) {
      console.error('Failed to parse database URL for auth:', err.message);
    }
  }
  
  headers['Prefer'] = headers['Prefer'] || 'return=representation';
  return headers;
}

async function neonFetch(path, options = {}) {
  if (!NEON_REST_URL) throw new Error('NEON_REST_URL is not configured');
  const url = `${NEON_REST_URL}${path}`;
  const res = await fetch(url, { ...options, headers: neonHeaders(options.headers || {}) });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch (_) { body = text; }
  if (!res.ok) {
    throw new Error(`Neon error ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
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

function requireAdmin(event) {
  const claims = getAuthClaims(event);
  if (!claims || claims.role !== 'admin') {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
  return claims;
}

module.exports = { neonFetch, getAuthClaims, requireAdmin };
