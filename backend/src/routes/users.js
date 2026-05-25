const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const logHistory = require('../middleware/logHistory');

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// GET /api/users/me — MUST be before /:id
router.get('/me', auth, async (req, res) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!req.user?.id || !uuidRegex.test(req.user.id)) {
      return res.json({ username: req.user?.username, email: '', first_name: '', last_name: '', mobile: '' });
    }
    const result = await pool.query('SELECT id, username, email, first_name, last_name, mobile, role FROM users WHERE id=$1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/users/me — MUST be before /:id
router.put('/me', auth, async (req, res) => {
  try {
    const { first_name, last_name, mobile, email } = req.body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!req.user?.id || !uuidRegex.test(req.user.id)) return res.status(400).json({ error: 'Invalid user' });
    await pool.query(
      `UPDATE users SET first_name=$1, last_name=$2, mobile=$3, email=$4 WHERE id=$5`,
      [first_name, last_name, mobile, email, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/me/change-password — MUST be before /:id
router.post('/me/change-password', auth, async (req, res) => {
  try {
    const { current, new: newPw } = req.body;
    if (!newPw || newPw.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!req.user?.id || !uuidRegex.test(req.user.id)) return res.status(400).json({ error: 'Invalid user' });
    const result = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(current, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPw, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /api/users
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, first_name, last_name, mobile, created_at FROM users ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'username, email and password are required' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, username, email, role, created_at`,
      [username, email, hash, role || 'viewer']
    );
    await logHistory(req.user?.id, 'CREATE', 'user', username, { role, email });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { username, email, role, first_name, last_name, mobile } = req.body;
    const result = await pool.query(
      `UPDATE users SET username=$1, email=$2, role=$3, first_name=$4, last_name=$5, mobile=$6 WHERE id=$7 RETURNING id, username, email, role, first_name, last_name, mobile, created_at`,
      [username, email, role, first_name||null, last_name||null, mobile||null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    await logHistory(req.user?.id, 'UPDATE', 'user', username, { role, email });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// POST /api/users/:id/reset-password
router.post('/:id/reset-password', auth, adminOnly, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `UPDATE users SET password_hash=$1 WHERE id=$2 RETURNING id, username`,
      [hash, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    await logHistory(req.user?.id, 'UPDATE', 'user', result.rows[0].username, { action: 'Password reset' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    const user = await pool.query('SELECT username FROM users WHERE id=$1', [req.params.id]);
    const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    await logHistory(req.user?.id, 'DELETE', 'user', user.rows[0]?.username, {});
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/users/:id/permissions
router.get('/:id/permissions', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_permissions WHERE user_id=$1', [req.params.id]);
    if (!result.rows.length) return res.json({ can_see_cost_price: true, can_see_customer_price: true });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// PUT /api/users/:id/permissions
router.put('/:id/permissions', auth, adminOnly, async (req, res) => {
  try {
    const { can_see_cost_price, can_see_customer_price } = req.body;
    const user = await pool.query('SELECT username FROM users WHERE id=$1', [req.params.id]);
    await pool.query(
      `INSERT INTO user_permissions (user_id, can_see_cost_price, can_see_customer_price)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
         can_see_cost_price=$2, can_see_customer_price=$3, updated_at=NOW()`,
      [req.params.id, can_see_cost_price, can_see_customer_price]
    );
    await logHistory(req.user?.id, 'UPDATE', 'user', user.rows[0]?.username, {
      action: 'Field permissions updated',
      cost_price: can_see_cost_price ? 'visible' : 'hidden',
      customer_price: can_see_customer_price ? 'visible' : 'hidden',
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

module.exports = router;