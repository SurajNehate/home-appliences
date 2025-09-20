# Neon DB integration via Netlify Functions

This project uses Netlify Functions to talk to Neon Postgres (REST/PostgREST) so that secrets stay on the server and not in the browser.

## Deploy prerequisites

1) Create your database tables in Neon

Run the SQL in `db/schema.sql` on your Neon database. You can use Neon Console, `psql`, or the REST SQL runner.

2) Configure environment variables in Netlify

Add these to your site’s Environment Variables (Site settings → Build & deploy → Environment → Environment variables):

- `NEON_REST_URL` = https://ep-soft-waterfall-aelrt553.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1
- Choose ONE of the following auth setups:
  - `NEON_API_KEY` = <your Neon REST API key> (preferred: Authorization: Bearer)
  - OR `NEON_BASIC_AUTH` = <base64(username:password)> for basic auth
- `JWT_SECRET` = <a strong random string> (for issuing login tokens)
- (optional) `JWT_EXPIRES_IN` = `7d` (default)

Do NOT commit secrets to the repo.

3) Functions

- Functions are under `netlify/functions`:
  - `products.js` → CRUD for products table
  - `users.js` → CRUD for users table

4) Frontend services

- Products and Users services now call `/.netlify/functions/*` instead of static JSON files.

## Local development

- `npm install`
- `npm start`

(Optional) To run Netlify Dev locally so functions are proxied:
- `npm install -g netlify-cli`
- `netlify dev` (will run Angular and functions together)

## SQL schema overview

Products table:
- id, name, price, image_url, images (JSON array of URLs), category, description, status, created_at

Users table:
- id, name, email (unique), password (store hash in production), phone, role, created_at

Optional table:
- product_images (normalized) — use if you prefer images separate from products

## Notes

- Image binaries are not stored in DB; only URLs. Host your images under `/assets/images` or external storage/CDN and put the URLs into `image_url` and `images[]`.
- The admin UI now saves products directly to the database. JSON download is no longer needed.
- For secure authentication, replace the simple password field with a hashed password and server-side auth flow.
