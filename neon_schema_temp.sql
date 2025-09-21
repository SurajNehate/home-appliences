-- Home Decor v19 - Neon schema aligned with current Netlify Functions and Angular app
-- This migrates to base64 image storage in products (image_data TEXT, additional_images TEXT[])
-- and removes URL-only columns/tables that the current code does not use.
-- You can paste this whole file into the Neon SQL editor.

-- 0) Use public schema (uncomment if your search_path isn’t public)
-- SET search_path TO public;

-- 1) Extensions (for faster ILIKE / trigram searches)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2) Helper: updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Users table (matches netlify/functions/auth-direct.js and users-direct.js)
CREATE TABLE IF NOT EXISTS public.users (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,               -- bcrypt hash stored here
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'member',  -- 'member' | 'admin'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns if table already existed
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Trigger for updated_at on users
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4) Products table (aligned to products-direct.js and image-upload.js)
CREATE TABLE IF NOT EXISTS public.products (
  id                 SERIAL PRIMARY KEY,
  name               TEXT NOT NULL,
  price              NUMERIC(12,2) NOT NULL,
  category           TEXT,
  description        TEXT,
  status             BOOLEAN NOT NULL DEFAULT TRUE,
  image_data         TEXT,         -- base64 of main image (no data URL prefix)
  additional_images  TEXT[],       -- array of base64 images (no data URL prefix)
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If migrating from URL-based schema, drop unused URL columns
ALTER TABLE public.products
  DROP COLUMN IF EXISTS image_url,
  DROP COLUMN IF EXISTS images;

-- Ensure columns if table already existed
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_data TEXT,
  ADD COLUMN IF NOT EXISTS additional_images TEXT[],
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Trigger for updated_at on products
DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5) Remove normalized URL images table if present (current code doesn’t use it)
DROP TABLE IF EXISTS public.product_images CASCADE;

-- 6) Optional: Binary-storage table (not used by current code, but available for future)
-- If you later want true BYTEA storage + serving through a function, keep this table.
CREATE TABLE IF NOT EXISTS public.product_images_bin (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
  filename      TEXT,
  content_type  TEXT,
  bytes         BYTEA NOT NULL,
  size          INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_products_category          ON public.products USING btree (category);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm         ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_desc_trgm         ON public.products USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_product_images_bin_product ON public.product_images_bin (product_id);

-- Done.
-- Notes:
-- - The Angular app currently sends base64 data URLs; functions strip the prefix and store raw base64 text.
-- - Returning endpoints re-wrap base64 with data:image/...;base64, so the frontend can display images.
-- - If you want to switch to true BYTEA storage and signed URLs later, we can update the functions to use product_images_bin.
