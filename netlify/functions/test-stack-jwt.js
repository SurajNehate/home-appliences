'use strict';
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const STACK_PROJECT_ID = process.env.STACK_PROJECT_ID;
    const STACK_SECRET_SERVER_KEY = process.env.STACK_SECRET_SERVER_KEY;
    const NEON_REST_URL = process.env.NEON_REST_URL;

    if (!STACK_PROJECT_ID || !STACK_SECRET_SERVER_KEY || !NEON_REST_URL) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing required environment variables' })
      };
    }

    const results = [];

    // Test 1: Generate an anonymous JWT using Stack Auth secret
    try {
      // Create anonymous JWT token
      const anonymousPayload = {
        sub: 'anonymous',
        aud: STACK_PROJECT_ID,
        iss: 'stack-auth',
        role: 'anonymous',
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
        iat: Math.floor(Date.now() / 1000)
      };

      // Note: Stack Auth uses ES256, but for server-side we might need to use the secret key differently
      // Let's try with HS256 first using the server key
      const anonymousToken = jwt.sign(anonymousPayload, STACK_SECRET_SERVER_KEY, { 
        algorithm: 'HS256' 
      });

      // Test the token with Neon
      const res = await fetch(`${NEON_REST_URL}/users?limit=1`, {
        headers: {
          'Authorization': `Bearer ${anonymousToken}`,
          'Content-Type': 'application/json'
        }
      });

      const text = await res.text();
      let responseData;
      try {
        responseData = text ? JSON.parse(text) : null;
      } catch (_) {
        responseData = text;
      }

      results.push({
        method: 'Anonymous JWT (HS256)',
        status: res.status,
        success: res.ok,
        response: res.ok ? 
          (Array.isArray(responseData) ? `Found ${responseData.length} users` : 'Success') :
          String(responseData).substring(0, 200),
        tokenLength: anonymousToken.length,
        tokenPrefix: anonymousToken.substring(0, 50) + '...'
      });

    } catch (err) {
      results.push({
        method: 'Anonymous JWT (HS256)',
        status: 'error',
        success: false,
        response: err.message.substring(0, 200)
      });
    }

    // Test 2: Try a different approach - authenticated user JWT
    try {
      const authenticatedPayload = {
        sub: '1', // User ID
        aud: STACK_PROJECT_ID,
        iss: 'stack-auth',
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + (60 * 60),
        iat: Math.floor(Date.now() / 1000)
      };

      const authenticatedToken = jwt.sign(authenticatedPayload, STACK_SECRET_SERVER_KEY, { 
        algorithm: 'HS256' 
      });

      const res2 = await fetch(`${NEON_REST_URL}/users?limit=1`, {
        headers: {
          'Authorization': `Bearer ${authenticatedToken}`,
          'Content-Type': 'application/json'
        }
      });

      const text2 = await res2.text();
      let responseData2;
      try {
        responseData2 = text2 ? JSON.parse(text2) : null;
      } catch (_) {
        responseData2 = text2;
      }

      results.push({
        method: 'Authenticated JWT (HS256)',
        status: res2.status,
        success: res2.ok,
        response: res2.ok ? 
          (Array.isArray(responseData2) ? `Found ${responseData2.length} users` : 'Success') :
          String(responseData2).substring(0, 200)
      });

    } catch (err) {
      results.push({
        method: 'Authenticated JWT (HS256)',
        status: 'error',
        success: false,
        response: err.message.substring(0, 200)
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Stack Auth JWT tests completed',
        results: results,
        config: {
          stackProjectId: STACK_PROJECT_ID,
          hasStackSecret: !!STACK_SECRET_SERVER_KEY,
          stackSecretLength: STACK_SECRET_SERVER_KEY.length,
          stackSecretPrefix: STACK_SECRET_SERVER_KEY.substring(0, 20) + '...',
          neonRestUrl: NEON_REST_URL.substring(0, 40) + '...'
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