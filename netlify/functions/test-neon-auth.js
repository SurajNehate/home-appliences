'use strict';
const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const NEON_REST_URL = process.env.NEON_REST_URL;
    const NEON_API_KEY = process.env.NEON_API_KEY;
    const NEON_BASIC_AUTH = process.env.NEON_BASIC_AUTH;

    if (!NEON_REST_URL) {
      return { statusCode: 500, body: JSON.stringify({ error: 'NEON_REST_URL not configured' }) };
    }

    const results = [];

    // Test 1: API Key Bearer token
    if (NEON_API_KEY) {
      try {
        const cleanApiKey = NEON_API_KEY.trim();
        const res1 = await fetch(`${NEON_REST_URL}/users?limit=1`, {
          headers: {
            'Authorization': `Bearer ${cleanApiKey}`,
            'Content-Type': 'application/json'
          }
        });
        const text1 = await res1.text();
        results.push({
          method: 'API Key Bearer',
          status: res1.status,
          success: res1.ok,
          response: text1.substring(0, 200) + (text1.length > 200 ? '...' : '')
        });
      } catch (err) {
        results.push({
          method: 'API Key Bearer',
          status: 'error',
          success: false,
          response: String(err).substring(0, 200)
        });
      }
    }

    // Test 2: Basic Auth
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
          response: text2.substring(0, 200) + (text2.length > 200 ? '...' : '')
        });
      } catch (err) {
        results.push({
          method: 'Basic Auth',
          status: 'error',
          success: false,
          response: String(err).substring(0, 200)
        });
      }
    }

    // Test 3: No auth (should fail)
    try {
      const res3 = await fetch(`${NEON_REST_URL}/users?limit=1`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const text3 = await res3.text();
      results.push({
        method: 'No Auth',
        status: res3.status,
        success: res3.ok,
        response: text3.substring(0, 200) + (text3.length > 200 ? '...' : '')
      });
    } catch (err) {
      results.push({
        method: 'No Auth',
        status: 'error',
        success: false,
        response: String(err).substring(0, 200)
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Authentication tests completed',
        results: results,
        summary: {
          neonRestUrl: NEON_REST_URL?.substring(0, 40) + '...',
          hasApiKey: !!NEON_API_KEY,
          hasBasicAuth: !!NEON_BASIC_AUTH
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