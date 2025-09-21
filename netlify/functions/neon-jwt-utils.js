'use strict';
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const NEON_REST_URL = process.env.NEON_REST_URL;
const NEON_JWT_SECRET = process.env.NEON_JWT_SECRET; // New: JWT secret for Neon Auth
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'; // Your app's JWT secret

// Generate a JWT token for Neon Auth
function generateNeonJWT(userId, userRole = 'authenticated') {
  if (!NEON_JWT_SECRET) {
    throw new Error('NEON_JWT_SECRET is not configured');
  }

  const payload = {
    sub: userId ? String(userId) : 'anonymous',
    role: userRole === 'admin' ? 'authenticated' : (userId ? 'authenticated' : 'anonymous'),
    aud: 'authenticated',
    iss: 'neon-auth',
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, NEON_JWT_SECRET, { algorithm: 'HS256' });
}

// Generate headers for Neon requests
function neonHeaders(userId = null, userRole = 'anonymous', extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...extra,
  };

  try {
    const token = generateNeonJWT(userId, userRole);
    headers['Authorization'] = `Bearer ${token}`;
  } catch (err) {
    console.error('Failed to generate Neon JWT:', err.message);
    // Fallback to anonymous access
    if (userId) {
      throw err; // Re-throw if we expected authentication
    }
  }

  return headers;
}

// Enhanced fetch for Neon with JWT authentication
async function neonFetch(path, options = {}, userId = null, userRole = 'anonymous') {
  if (!NEON_REST_URL) throw new Error('NEON_REST_URL is not configured');
  
  const url = `${NEON_REST_URL}${path}`;
  const headers = neonHeaders(userId, userRole, options.headers || {});
  
  const res = await fetch(url, { 
    ...options, 
    headers 
  });
  
  const text = await res.text();
  let body;
  try { 
    body = text ? JSON.parse(text) : null; 
  } catch (_) { 
    body = text; 
  }
  
  if (!res.ok) {
    throw new Error(`Neon error ${res.status}: ${JSON.stringify(body)}`);
  }
  
  return body;
}

// Get user claims from your app's JWT (not Neon's)
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

// Require admin role
function requireAdmin(event) {
  const claims = getAuthClaims(event);
  if (!claims || claims.role !== 'admin') {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
  return claims;
}

// Enhanced neonFetch that extracts user info from request
async function neonFetchWithAuth(path, options = {}, event = null) {
  let userId = null;
  let userRole = 'anonymous';
  
  if (event) {
    const claims = getAuthClaims(event);
    if (claims) {
      userId = claims.sub;
      userRole = claims.role || 'authenticated';
    }
  }
  
  return neonFetch(path, options, userId, userRole);
}

module.exports = { 
  neonFetch, 
  neonFetchWithAuth, 
  getAuthClaims, 
  requireAdmin,
  generateNeonJWT,
  neonHeaders
};