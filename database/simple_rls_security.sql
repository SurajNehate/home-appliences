-- Simple Row-Level Security without JWT complexity
-- This approach uses application-level security in your Netlify functions

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images_bin ENABLE ROW LEVEL SECURITY;

-- 2. Create simple policies that allow your rest_user to access everything
-- Your application logic will handle the security

-- Users table - allow all operations for your rest_user role
CREATE POLICY "Allow rest_user full access to users" ON users
  FOR ALL
  TO rest_user
  USING (true)
  WITH CHECK (true);

-- Products table - allow all operations 
CREATE POLICY "Allow rest_user full access to products" ON products
  FOR ALL
  TO rest_user
  USING (true)
  WITH CHECK (true);

-- Product images table - allow all operations
CREATE POLICY "Allow rest_user full access to product_images" ON product_images
  FOR ALL
  TO rest_user
  USING (true)
  WITH CHECK (true);

-- Product images binary table - allow all operations
CREATE POLICY "Allow rest_user full access to product_images_bin" ON product_images_bin
  FOR ALL
  TO rest_user
  USING (true)
  WITH CHECK (true);

-- 3. Deny anonymous/public access (security comes from your API layer)
CREATE POLICY "Deny anonymous access to users" ON users
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Allow anonymous read access to products" ON products
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read access to product_images" ON product_images
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read access to product_images_bin" ON product_images_bin
  FOR SELECT
  TO anon
  USING (true);