const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// GET /api/settings
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM system_settings WHERE key='session_timeout'");
    const timeout = result.rows[0]?.value || '30';
    res.json({ session_timeout: timeout });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings/session-timeout
router.put('/session-timeout', auth, adminOnly, async (req, res) => {
  try {
    const { value } = req.body;
    await pool.query(
      `INSERT INTO system_settings (key, value) VALUES ('session_timeout', $1)
       ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`,
      [value.toString()]
    );
    res.json({ success: true, session_timeout: value });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save setting' });
  }
});

module.exports = router;
