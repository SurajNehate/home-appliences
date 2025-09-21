-- Neon Postgres schema for Home Decor app

-- Products table stores product info and images (as JSON array of URLs)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT,
  description TEXT,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (simple auth data; consider hashing passwords in production)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,          -- TODO: replace with password_hash
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Normalized product_images table (optional but enabled for flexibility)
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Enable trigram extension for faster ILIKE searches (optional)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products USING btree (category);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_desc_trgm ON products USING gin (description gin_trgm_ops);

-- Binary images stored in DB (optional). Serving via Netlify Functions.
CREATE TABLE IF NOT EXISTS product_images_bin (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  filename TEXT,
  content_type TEXT,
  bytes BYTEA NOT NULL,
  size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_images_bin_product ON product_images_bin (product_id);
