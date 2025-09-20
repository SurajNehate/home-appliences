'use strict';
const { neonFetch } = require('./utils');

exports.handler = async (event) => {
  try {
    const method = event.httpMethod;
    const params = event.queryStringParameters || {};
    const id = params.id ? Number(params.id) : undefined;

    if (method === 'GET') {
      // Support filters: id, category, search
      const filters = [];
      if (id) filters.push(`id=eq.${id}`);
      if (params.category) filters.push(`category=eq.${encodeURIComponent(params.category)}`);
      // Join product_images to return normalized images as array
      let path = `/products?select=*,product_images(url,sort_order)`;
      if (filters.length) path += `&${filters.join('&')}`;
      // Simple search on name/description
      if (params.search) {
        const s = params.search.replace(/%/g, '').toLowerCase();
        // ilike with wildcards
        path += `&or=(name.ilike.*${encodeURIComponent(s)}*,description.ilike.*${encodeURIComponent(s)}*)`;
      }
      const rows = await neonFetch(path, { method: 'GET' });
      // Map nested product_images to images array for frontend compatibility
      const data = (rows || []).map(r => ({
        ...r,
        images: (Array.isArray(r.images) && r.images.length)
          ? r.images
          : (Array.isArray(r.product_images) ? r.product_images.sort((a,b)=>a.sort_order-b.sort_order).map(pi => pi.url) : []),
        imageUrl: r.image_url || r.imageUrl || (Array.isArray(r.product_images) && r.product_images[0] ? r.product_images[0].url : r.image_url)
      }));
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    if (method === 'POST') {
      // Require admin token
      const { requireAdmin } = require('./utils');
      requireAdmin(event);
      const payload = JSON.parse(event.body || '{}');
      // Insert product first (image_url set from first image if not provided)
      const images = Array.isArray(payload.images) ? payload.images : [];
      const image_url = payload.image_url || payload.imageUrl || images[0] || null;
      const productRows = await neonFetch(`/products`, { method: 'POST', body: JSON.stringify({
        name: payload.name,
        price: payload.price,
        image_url,
        images: Array.isArray(payload.images) ? payload.images : [],
        category: payload.category,
        description: payload.description,
        status: payload.status !== undefined ? !!payload.status : true
      }) });
      const product = Array.isArray(productRows) ? productRows[0] : null;
      if (!product) return { statusCode: 500, body: 'Failed to insert product' };

      // Also insert into product_images for normalized access
      if (images.length) {
        const bulk = images.map((url, i) => ({ product_id: product.id, url, sort_order: i }));
        await neonFetch(`/product_images`, { method: 'POST', body: JSON.stringify(bulk) });
      }
      return { statusCode: 200, body: JSON.stringify([product]) };
    }

    if (method === 'PUT' || method === 'PATCH') {
      // Require admin token
      const { requireAdmin } = require('./utils');
      requireAdmin(event);
      if (!id) return { statusCode: 400, body: 'Missing id' };
      const updates = JSON.parse(event.body || '{}');
      // Split images from other fields for full sync
      const images = Array.isArray(updates.images) ? updates.images : undefined;
      const productFields = { ...updates };
      delete productFields.images;

      let updatedProduct = null;
      if (Object.keys(productFields).length) {
        const rows = await neonFetch(`/products?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(productFields) });
        updatedProduct = Array.isArray(rows) ? rows[0] : null;
      }

      if (images) {
        // Replace product_images with provided set (full sync)
        await neonFetch(`/product_images?product_id=eq.${id}`, { method: 'DELETE' });
        if (images.length) {
          const bulk = images.map((url, i) => ({ product_id: id, url, sort_order: i }));
          await neonFetch(`/product_images`, { method: 'POST', body: JSON.stringify(bulk) });
        }
      }

      // Return fresh row with images mapping
      const fresh = await neonFetch(`/products?select=*,product_images(url,sort_order)&id=eq.${id}`);
      const mapped = (fresh || []).map(r => ({
        ...r,
        images: (Array.isArray(r.images) && r.images.length)
          ? r.images
          : (Array.isArray(r.product_images) ? r.product_images.sort((a,b)=>a.sort_order-b.sort_order).map(pi => pi.url) : []),
        imageUrl: r.image_url || r.imageUrl || (Array.isArray(r.product_images) && r.product_images[0] ? r.product_images[0].url : r.image_url)
      }));
      return { statusCode: 200, body: JSON.stringify(mapped) };
    }

    if (method === 'DELETE') {
      // Require admin token
      const { requireAdmin } = require('./utils');
      requireAdmin(event);
      if (!id) return { statusCode: 400, body: 'Missing id' };
      const body = await neonFetch(`/products?id=eq.${id}`, { method: 'DELETE' });
      return { statusCode: 200, body: JSON.stringify(body) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};