-- Neon full schema for Home Decor project (public schema)
-- You can paste this whole file into the Neon SQL editor and run.
-- If your search_path isn’t public, uncomment the following line:
-- SET search_path TO public;

-- 1) Extensions (for faster ILIKE searches)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2) Users table
-- In production, store only password hashes. The Netlify auth-signup function hashes for you.
CREATE TABLE IF NOT EXISTS public.users (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,              -- bcrypt hash expected
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'member',  -- 'member' | 'admin'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) Products table
-- Keep both image_url (main image) and images (JSON array of URLs) for convenience.
CREATE TABLE IF NOT EXISTS public.products (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  price        NUMERIC(10,2) NOT NULL,
  image_url    TEXT,
  images       JSONB NOT NULL DEFAULT '[]'::jsonb,
  category     TEXT,
  description  TEXT,
  status       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) Normalized images table (URL-based)
-- The API writes here to preserve image order and to support SQL joins.
CREATE TABLE IF NOT EXISTS public.product_images (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- 5) Optional: Binary images stored in Postgres
-- Admin uploads go to this table. Serving is via /.netlify/functions/image?id=...,
-- and the generated URLs are stored in products.images.
CREATE TABLE IF NOT EXISTS public.product_images_bin (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
  filename      TEXT,
  content_type  TEXT,
  bytes         BYTEA NOT NULL,
  size          INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_products_category          ON public.products USING btree (category);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm         ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_desc_trgm         ON public.products USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_product_images_product     ON public.product_images (product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_bin_product ON public.product_images_bin (product_id);

-- 7) Orders tables
-- These support checkout and admin order management
CREATE TABLE IF NOT EXISTS public.orders (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT,
  customer_phone  TEXT,
  customer_address TEXT,
  total           NUMERIC(10,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'new', -- new, paid, shipped, cancelled, completed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,           -- snapshot of product name
  price       NUMERIC(10,2) NOT NULL,  -- snapshot of price at order time
  qty         INTEGER NOT NULL,
  image_url   TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 8) (Optional) Grants for your REST role
-- Replace <rest_role> with the role used by your NEON_API_KEY or Basic auth.
-- If unsure, you can skip; many setups already have adequate privileges.
-- GRANT USAGE ON SCHEMA public TO <rest_role>;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO <rest_role>;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO <rest_role>;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO <rest_role>;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO <rest_role>;
-- End of schema.sql