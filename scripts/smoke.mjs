/* Simple Netlify Functions smoke tests.
   Requires Netlify Dev running. Set NETLIFY_DEV_URL to override (default http://localhost:8888).
*/

const base = process.env.NETLIFY_DEV_URL || 'http://localhost:8888';

async function main() {
  const out = [];

  async function step(name, fn) {
    try {
      const v = await fn();
      out.push({ name, ok: true, result: v });
      console.log(`[OK] ${name}`);
    } catch (e) {
      out.push({ name, ok: false, error: String(e) });
      console.error(`[FAIL] ${name}:`, e?.message || e);
    }
  }

  // 1) DB health
  await step('db-health', async () => {
    const r = await fetch(`${base}/.netlify/functions/db-health`);
    const j = await r.json();
    if (!j.ok) throw new Error('db-health not ok');
    return j;
  });

  // 2) Signup temp admin (idempotent on email uniqueness)
  const email = `admin_${Date.now()}@example.com`;
  const password = 'Admin123!';
  let token;

  await step('auth-direct signup', async () => {
    const r = await fetch(`${base}/.netlify/functions/auth-direct?action=signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke Admin', email, password, role: 'admin' })
    });
    if (!r.ok) throw new Error(`signup failed: ${r.status}`);
    const j = await r.json();
    token = j.token;
    if (!token) throw new Error('no token');
    return { user: j.user };
  });

  // 3) Login
  await step('auth-direct login', async () => {
    const r = await fetch(`${base}/.netlify/functions/auth-direct?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!r.ok) throw new Error(`login failed: ${r.status}`);
    const j = await r.json();
    if (!j.token) throw new Error('no token on login');
    token = j.token;
    return { user: j.user };
  });

  // 4) Products list
  await step('products-direct GET', async () => {
    const r = await fetch(`${base}/.netlify/functions/products-direct`);
    if (!r.ok) throw new Error(`products GET failed: ${r.status}`);
    const j = await r.json();
    if (!Array.isArray(j)) throw new Error('products not array');
    return { count: j.length };
  });

  // 5) Create + delete a product (admin)
  let productId;
  await step('products-direct POST', async () => {
    const r = await fetch(`${base}/.netlify/functions/products-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Smoke Test Product',
        price: 9.99,
        category: 'Testing',
        description: 'Created by smoke test',
        status: true
      })
    });
    if (!r.ok) throw new Error(`product create failed: ${r.status}`);
    const j = await r.json();
    if (!j?.id) throw new Error('no id');
    productId = j.id;
    return { id: productId };
  });

  await step('products-direct DELETE', async () => {
    const r = await fetch(`${base}/.netlify/functions/products-direct?id=${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!r.ok) throw new Error(`product delete failed: ${r.status}`);
    return { id: productId };
  });

  console.log('\nSmoke results:\n', JSON.stringify(out, null, 2));
}

main().catch(err => {
  console.error('Smoke tests crashed:', err);
  process.exit(1);
});
