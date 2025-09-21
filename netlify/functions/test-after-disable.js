'use strict';
const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const NEON_REST_URL = process.env.NEON_REST_URL;
    const NEON_BASIC_AUTH = process.env.NEON_BASIC_AUTH;
    const NETLIFY_DATABASE_URL = process.env.NETLIFY_DATABASE_URL;

    const results = [];

    // Test 1: No authentication
    try {
      const res1 = await fetch(`${NEON_REST_URL}/users?limit=1`, {
        headers: { 'Content-Type': 'application/json' }
      });
      const text1 = await res1.text();
      results.push({
        method: 'No Auth',
        status: res1.status,
        success: res1.ok,
        response: text1.substring(0, 200)
      });
    } catch (err) {
      results.push({
        method: 'No Auth',
        status: 'error',
        success: false,
        response: err.message.substring(0, 200)
      });
    }

    // Test 2: Basic Auth (if available)
    if (NEON_BASIC_AUTH) {
      try {
        const res2 = await fetch(`${NEON_REST_URL}/users?limit=1`, {
          headers: {
            'Authorization': `Basic ${NEON_BASIC_AUTH}`,
            'Content-Type': 'application/json'
          }
        });
        const text2 = await res2.text();
        results.push({
          method: 'Basic Auth',
          status: res2.status,
          success: res2.ok,
          response: text2.substring(0, 200)
        });
      } catch (err) {
        results.push({
          method: 'Basic Auth',
          status: 'error',
          success: false,
          response: err.message.substring(0, 200)
        });
      }
    } else {
      results.push({
        method: 'Basic Auth',
        status: 'not configured',
        success: false,
        response: 'NEON_BASIC_AUTH environment variable not set'
      });
    }

    // Test 3: Database URL extraction
    if (NETLIFY_DATABASE_URL) {
      try {
        const url = new URL(NETLIFY_DATABASE_URL);
        const username = url.username;
        const password = url.password;
        
        if (username && password) {
          const credentials = Buffer.from(`${username}:${password}`).toString('base64');
          
          const res3 = await fetch(`${NEON_REST_URL}/users?limit=1`, {
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/json'
            }
          });
          const text3 = await res3.text();
          results.push({
            method: 'Database URL Credentials',
            status: res3.status,
            success: res3.ok,
            response: text3.substring(0, 200),
            extractedUsername: username
          });
        } else {
          results.push({
            method: 'Database URL Credentials',
            status: 'no credentials',
            success: false,
            response: 'Could not extract username/password from DATABASE_URL'
          });
        }
      } catch (err) {
        results.push({
          method: 'Database URL Credentials',
          status: 'error',
          success: false,
          response: err.message.substring(0, 200)
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Authentication tests after disabling Neon Auth',
        results: results,
        config: {
          hasNeonRestUrl: !!NEON_REST_URL,
          hasNeonBasicAuth: !!NEON_BASIC_AUTH,
          hasDatabaseUrl: !!NETLIFY_DATABASE_URL,
          neonRestUrl: NEON_REST_URL ? NEON_REST_URL.substring(0, 40) + '...' : null
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