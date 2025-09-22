import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Health-check for Neon DB connectivity (server-side, SSR/local dev).
 * Requires NEON_DATABASE_URL env var (e.g., postgresql://... with sslmode=require).
 */
app.get('/api/health/db', async (_req, res) => {
  const connStr = process.env['NEON_DATABASE_URL'];
  if (!connStr) {
    return res.status(500).json({ ok: false, error: 'NEON_DATABASE_URL_NOT_SET' });
  }
  const client = new Client({ connectionString: connStr });
  try {
    await client.connect();
    const r = await client.query('select 1 as ok');
    await client.end();
    return res.json({ ok: r.rows?.[0]?.ok === 1 });
  } catch (err) {
    console.error('DB health check failed:', err);
    try { await client.end(); } catch {}
    return res.status(500).json({ ok: false, error: 'DB_CONNECTION_FAILED' });
  }
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
