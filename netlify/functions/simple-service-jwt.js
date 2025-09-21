'use strict';
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// Simple service account JWT for Neon Auth
// This creates a "service" user that can access the database
function createServiceJWT() {
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
  
  const payload = {
    sub: 'service-account',
    role: 'authenticated', // or 'service_role'
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

exports.handler = async (event) => {
  try {
    const NEON_REST_URL = process.env.NEON_REST_URL;
    const serviceToken = createServiceJWT();

    // Test the service JWT with Neon
    const res = await fetch(`${NEON_REST_URL}/users?limit=1`, {
      headers: {
        'Authorization': `Bearer ${serviceToken}`,
        'Content-Type': 'application/json'
      }
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = text;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Service JWT test completed',
        result: {
          status: res.status,
          success: res.ok,
          response: res.ok ? 
            (Array.isArray(data) ? `Found ${data.length} users` : 'Success') :
            String(data).substring(0, 200)
        },
        serviceToken: {
          length: serviceToken.length,
          prefix: serviceToken.substring(0, 50) + '...'
        }
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) })
    };
  }
};