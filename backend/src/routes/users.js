const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// Only admins
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// GET /api/users
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at ASC');
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
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const result = await pool.query(
      `UPDATE users SET username=$1, email=$2, role=$3 WHERE id=$4 RETURNING id, username, email, role, created_at`,
      [username, email, role, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
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
      `UPDATE users SET password_hash=$1 WHERE id=$2 RETURNING id`,
      [hash, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    // prevent self-delete
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
