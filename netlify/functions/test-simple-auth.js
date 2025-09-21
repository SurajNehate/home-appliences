'use strict';
const { neonFetch } = require('./utils');

exports.handler = async (event) => {
  try {
    const results = [];

    // Test basic auth access
    try {
      const data = await neonFetch('/users?limit=1');
      results.push({
        method: 'Basic Auth',
        success: true,
        status: 200,
        response: Array.isArray(data) ? `Found ${data.length} users` : 'Success',
        data: data
      });
    } catch (err) {
      results.push({
        method: 'Basic Auth',
        success: false,
        status: 'error',
        response: err.message
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Simple authentication test completed',
        results: results,
        config: {
          hasNeonBasicAuth: !!process.env.NEON_BASIC_AUTH,
          hasNeonRestUrl: !!process.env.NEON_REST_URL,
          neonRestUrl: process.env.NEON_REST_URL?.substring(0, 40) + '...'
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