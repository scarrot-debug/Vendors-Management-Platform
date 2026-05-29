const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const logHistory = require('../middleware/logHistory');

// GET /api/vendors — distributors with their products
router.get('/', auth, async (req, res) => {
  try {
    const { status, search, category, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    if (status && status !== 'All Status') {
      params.push(status);
      conditions.push(`d.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(d.name ILIKE $${idx} OR d.contact ILIKE $${idx} OR d.email ILIKE $${idx} OR EXISTS (
        SELECT 1 FROM products p WHERE p.distributor_id = d.id AND (p.name ILIKE $${idx} OR p.vendor ILIKE $${idx} OR p.category ILIKE $${idx})
      ))`);
    }
    if (category && category !== 'All Categories') {
      params.push(category);
      conditions.push(`EXISTS (SELECT 1 FROM products p WHERE p.distributor_id = d.id AND p.category = $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await pool.query(`SELECT COUNT(*) FROM distributors d ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(parseInt(limit));
    params.push(offset);
    const distRes = await pool.query(
      `SELECT d.* FROM distributors d ${where} ORDER BY d.name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const ids = distRes.rows.map(r => r.id);
    let products = [];
    if (ids.length > 0) {
      const prodRes = await pool.query(
        `SELECT * FROM products WHERE distributor_id = ANY($1) ORDER BY name ASC`, [ids]
      );
      products = prodRes.rows;
    }

    const distributors = distRes.rows.map(d => ({
      ...d,
      products: products.filter(p => p.distributor_id === d.id),
    }));

    res.json({ distributors, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch distributors' });
  }
});

// GET /api/vendors/categories
router.get('/categories', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category');
    res.json(result.rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/vendors/export
router.get('/export', auth, async (req, res) => {
  try {
    const distRes = await pool.query('SELECT * FROM distributors ORDER BY name');
    const prodRes = await pool.query('SELECT * FROM products ORDER BY name');

    const products = prodRes.rows;
    const rows = [];

    // Header
    rows.push(['Distributor', 'Status', 'Contact', 'Email', 'Phone', 'Mobile', 'Website', 'Product', 'Manufacturer', 'Category', 'Cost Price', 'Customer Price', 'Currency', 'Product Status', 'Description']);

    distRes.rows.forEach(d => {
      const distProds = products.filter(p => p.distributor_id === d.id);
      if (distProds.length === 0) {
        rows.push([d.name, d.status, d.contact || '', d.email || '', d.phone || '', d.mobile || '', d.website || '', '', '', '', '', '', '', '', '']);
      } else {
        distProds.forEach(p => {
          rows.push([d.name, d.status, d.contact || '', d.email || '', d.phone || '', d.mobile || '', d.website || '',
            p.name, p.vendor || '', p.category || '', p.cost || '', p.customer_price || '', p.currency || '', p.status, p.description || '']);
        });
      }
    });

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vendors-export.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export' });
  }
});

// GET /api/vendors/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const dist = await pool.query('SELECT * FROM distributors WHERE id=$1', [req.params.id]);
    if (!dist.rows.length) return res.status(404).json({ error: 'Distributor not found' });
    const prods = await pool.query('SELECT * FROM products WHERE distributor_id=$1 ORDER BY name', [req.params.id]);
    res.json({ ...dist.rows[0], products: prods.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch distributor' });
  }
});

// POST /api/vendors
router.post('/', auth, async (req, res) => {
  try {
    const { name, contact, email, phone, mobile, website, status, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await pool.query(
      `INSERT INTO distributors (name, contact, email, phone, mobile, website, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, contact, email, phone, mobile, website, status || 'Active', notes]
    );
    await logHistory(req.user?.id, 'CREATE', 'distributor', name, { status, contact, email, phone, website });
    res.status(201).json({ ...result.rows[0], products: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create distributor' });
  }
});

// PUT /api/vendors/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, contact, email, phone, mobile, website, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE distributors SET name=$1, contact=$2, email=$3, phone=$4, mobile=$5, website=$6, status=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [name, contact, email, phone, mobile, website, status, notes, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    await logHistory(req.user?.id, 'UPDATE', 'distributor', name, { status, contact, email, phone, website });
    const prods = await pool.query('SELECT * FROM products WHERE distributor_id=$1 ORDER BY name', [req.params.id]);
    res.json({ ...result.rows[0], products: prods.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update distributor' });
  }
});

// DELETE /api/vendors/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const dist = await pool.query('SELECT name FROM distributors WHERE id=$1', [req.params.id]);
    const result = await pool.query('DELETE FROM distributors WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    await logHistory(req.user?.id, 'DELETE', 'distributor', dist.rows[0]?.name, {});
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete distributor' });
  }
});

// POST /api/vendors/:id/products
router.post('/:id/products', auth, async (req, res) => {
  try {
    const { name, category, vendor, cost, customer_price, currency, status, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const dist = await pool.query('SELECT name FROM distributors WHERE id=$1', [req.params.id]);
    const result = await pool.query(
      `INSERT INTO products (distributor_id, name, category, vendor, cost, customer_price, currency, status, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.id, name, category, vendor, cost || null, customer_price || null, currency || 'USD', status || 'Active', description]
    );
    await logHistory(req.user?.id, 'CREATE', 'product', name, { distributor: dist.rows[0]?.name, category, cost, customer_price, currency });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/vendors/:id/products/:pid
router.put('/:id/products/:pid', auth, async (req, res) => {
  try {
    const { name, category, vendor, cost, customer_price, currency, status, description } = req.body;
    const dist = await pool.query('SELECT name FROM distributors WHERE id=$1', [req.params.id]);
    const result = await pool.query(
      `UPDATE products SET name=$1, category=$2, vendor=$3, cost=$4, customer_price=$5, currency=$6, status=$7, description=$8, updated_at=NOW()
       WHERE id=$9 AND distributor_id=$10 RETURNING *`,
      [name, category, vendor, cost || null, customer_price || null, currency || 'USD', status, description, req.params.pid, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    await logHistory(req.user?.id, 'UPDATE', 'product', name, { distributor: dist.rows[0]?.name, category, cost, customer_price, currency });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/vendors/:id/products/:pid
router.delete('/:id/products/:pid', auth, async (req, res) => {
  try {
    const prod = await pool.query('SELECT name FROM products WHERE id=$1', [req.params.pid]);
    const result = await pool.query(
      'DELETE FROM products WHERE id=$1 AND distributor_id=$2 RETURNING id',
      [req.params.pid, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    await logHistory(req.user?.id, 'DELETE', 'product', prod.rows[0]?.name, {});
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
