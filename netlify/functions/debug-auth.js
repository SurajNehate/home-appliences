'use strict';

exports.handler = async (event) => {
  try {
    const NEON_REST_URL = process.env.NEON_REST_URL;
    const NEON_API_KEY = process.env.NEON_API_KEY;
    const NEON_BASIC_AUTH = process.env.NEON_BASIC_AUTH;

    // Debug info (don't log full keys in production!)
    const debug = {
      hasNeonRestUrl: !!NEON_REST_URL,
      neonRestUrl: NEON_REST_URL ? NEON_REST_URL.substring(0, 30) + '...' : null,
      hasNeonApiKey: !!NEON_API_KEY,
      neonApiKeyLength: NEON_API_KEY ? NEON_API_KEY.length : 0,
      neonApiKeyPrefix: NEON_API_KEY ? NEON_API_KEY.substring(0, 20) + '...' : null,
      hasBasicAuth: !!NEON_BASIC_AUTH,
      basicAuthLength: NEON_BASIC_AUTH ? NEON_BASIC_AUTH.length : 0,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ debug })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) })
    };
  }
};