'use strict';
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const NEON_REST_URL = process.env.NEON_REST_URL;
const STACK_PROJECT_ID = process.env.STACK_PROJECT_ID;
const STACK_SECRET_SERVER_KEY = process.env.STACK_SECRET_SERVER_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'; // Your app's JWT secret

// JWKS client for Stack Auth
const client = jwksClient({
  jwksUri: `https://api.stack-auth.com/api/v1/projects/${STACK_PROJECT_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

// Get Stack Auth signing key
function getStackAuthKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Verify Stack Auth JWT token
function verifyStackAuthToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getStackAuthKey, {
      audience: STACK_PROJECT_ID,
      issuer: 'stack-auth',
      algorithms: ['ES256', 'RS256']
    }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

// Generate headers for Neon requests using Stack Auth JWT
function neonHeaders(stackAuthToken = null, extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...extra,
  };

  if (stackAuthToken) {
    // Use the Stack Auth token directly - Neon Auth will validate it
    headers['Authorization'] = `Bearer ${stackAuthToken}`;
  }
  // If no token, Neon will treat as anonymous

  return headers;
}

// Enhanced fetch for Neon with Stack Auth JWT
async function neonFetch(path, options = {}, stackAuthToken = null) {
  if (!NEON_REST_URL) throw new Error('NEON_REST_URL is not configured');
  
  const url = `${NEON_REST_URL}${path}`;
  const headers = neonHeaders(stackAuthToken, options.headers || {});
  
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

// Get Stack Auth claims from request
async function getStackAuthClaims(event) {
  const h = event.headers || {};
  const auth = h.authorization || h.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  
  if (!token) return null;
  
  try {
    // Try to verify as Stack Auth token first
    const claims = await verifyStackAuthToken(token);
    return { ...claims, tokenType: 'stack-auth' };
  } catch (stackAuthErr) {
    // Fallback to your app's JWT for backward compatibility
    try {
      const claims = jwt.verify(token, JWT_SECRET);
      return { ...claims, tokenType: 'app-jwt' };
    } catch (appJwtErr) {
      return null;
    }
  }
}

// Require admin role
async function requireAdmin(event) {
  const claims = await getStackAuthClaims(event);
  if (!claims || claims.role !== 'admin') {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
  return claims;
}

// Enhanced neonFetch that extracts Stack Auth token from request
async function neonFetchWithAuth(path, options = {}, event = null) {
  let stackAuthToken = null;
  
  if (event) {
    const h = event.headers || {};
    const auth = h.authorization || h.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    
    if (token) {
      try {
        // Verify it's a valid Stack Auth token before using it
        await verifyStackAuthToken(token);
        stackAuthToken = token;
      } catch (err) {
        // If not a Stack Auth token, proceed without auth (anonymous)
        console.warn('Token is not a valid Stack Auth token:', err.message);
      }
    }
  }
  
  return neonFetch(path, options, stackAuthToken);
}

module.exports = { 
  neonFetch, 
  neonFetchWithAuth, 
  getStackAuthClaims,
  requireAdmin,
  verifyStackAuthToken,
  neonHeaders
};