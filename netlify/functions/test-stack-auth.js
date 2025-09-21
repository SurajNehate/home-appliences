'use strict';
const { neonFetch } = require('./stack-auth-utils');

exports.handler = async (event) => {
  try {
    const STACK_PROJECT_ID = process.env.STACK_PROJECT_ID;
    const NEON_REST_URL = process.env.NEON_REST_URL;
    const STACK_SECRET_SERVER_KEY = process.env.STACK_SECRET_SERVER_KEY;

    const results = [];

    // Test 1: Anonymous access (no JWT token)
    try {
      const data1 = await neonFetch('/users?limit=1');
      results.push({
        method: 'Anonymous (no token)',
        success: true,
        status: 200,
        response: Array.isArray(data1) ? `Found ${data1.length} users` : 'Success'
      });
    } catch (err) {
      results.push({
        method: 'Anonymous (no token)',
        success: false,
        status: 'error',
        response: err.message.substring(0, 200)
      });
    }

    // Note: We can't test authenticated access here without a real Stack Auth token
    // That would need to come from your frontend after user login

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Stack Auth configuration test completed',
        results: results,
        config: {
          hasStackProjectId: !!STACK_PROJECT_ID,
          stackProjectId: STACK_PROJECT_ID,
          hasStackSecretKey: !!STACK_SECRET_SERVER_KEY,
          stackSecretKeyLength: STACK_SECRET_SERVER_KEY ? STACK_SECRET_SERVER_KEY.length : 0,
          hasNeonRestUrl: !!NEON_REST_URL,
          neonRestUrl: NEON_REST_URL ? NEON_REST_URL.substring(0, 40) + '...' : null,
          jwksUrl: `https://api.stack-auth.com/api/v1/projects/${STACK_PROJECT_ID}/.well-known/jwks.json`
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