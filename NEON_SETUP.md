# Neon DB (direct) + Netlify Functions setup

This project uses Netlify Functions with the Neon serverless Postgres driver (@neondatabase/serverless) so that database access happens on the server. The Angular app talks only to 
/.netlify/functions/* endpoints.

## Prerequisites

- A Neon Postgres database (connection string)
- A JWT secret for admin auth
- (Optional) Cloudinary account if you want server-side image uploads

## Required environment variables (Netlify → Site settings → Build & deploy → Environment)

- NEON_DATABASE_URL = postgres://user:password@host/db?sslmode=require
- JWT_SECRET = a strong secret string
- (Optional) CLOUDINARY_URL = cloudinary://<api_key>:<api_secret>@<cloud_name>

Do NOT commit secrets to the repo.

## Functions

- /.netlify/functions/auth-direct → signup/login/current-user (direct Neon)
- /.netlify/functions/products-direct → CRUD for products (direct Neon)
- /.netlify/functions/orders-direct → create and list orders (admin auth required for GET)
- /.netlify/functions/image-upload → upload images to Cloudinary and update product image fields
- Utility (optional, for local/demo data):
  - /.netlify/functions/setup-test-data
  - /.netlify/functions/update-schema

## Database schema (created on-demand)

Tables are created automatically on first call if they do not exist:
- users(id, name, email unique, password_hash, role, created_at)
- products(id, name, price, category, description, status, image_url, images[], created_at, updated_at)
- orders(id, user_id, name, email, address, phone, items jsonb, total, created_at)

## Local development

- npm install
- To run Angular only: npm start (http://localhost:4200)
- To run Angular + Netlify Functions together (recommended): npm run dev:netlify
  - This proxies /.netlify/functions/* to local function handlers

## Deployment (Netlify)

- netlify.toml already points publish to dist/home-decor-v19 and functions to netlify/functions
- Ensure env vars are set on your Netlify site
- Push to your Git remote; Netlify will build and deploy

## Notes

- Admin-only actions require Bearer token from auth-direct responses.
- Frontend services call server endpoints; no DB credentials are exposed in the browser.
- If migrating from the older project, prefer the new direct Neon TypeScript functions (*-direct.ts). Older JS helpers were updated to also accept NEON_DATABASE_URL.
