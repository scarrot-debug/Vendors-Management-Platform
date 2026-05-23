const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    const user = result.rows[0];

    // For demo: accept known users directly
    if ((username === 'admin' && password === 'admin123') ||
        (username === 'viewer' && password === 'viewer123')) {
      const dbUser = result.rows[0];
      const role = dbUser?.role || (username === 'viewer' ? 'viewer' : 'admin');
      const token = jwt.sign(
        { id: dbUser?.id || username, username, role },
        process.env.JWT_SECRET || 'supersecretjwtkey',
        { expiresIn: '8h' }
      );
      return res.json({
        token,
        user: { username, role, email: dbUser?.email || `${username}@one.local` }
      });
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '8h' }
    );
    res.json({ token, user: { username: user.username, role: user.role, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
