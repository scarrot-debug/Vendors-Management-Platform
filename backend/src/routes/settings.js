const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const logHistory = require('../middleware/logHistory');

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// GET /api/settings/my-permissions — for logged in user
router.get('/my-permissions', auth, async (req, res) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!req.user?.id || !uuidRegex.test(req.user.id)) {
      return res.json({ can_see_cost_price: true, can_see_customer_price: true });
    }
    const result = await pool.query(
      'SELECT * FROM user_permissions WHERE user_id=$1', [req.user.id]
    );
    if (!result.rows.length) {
      return res.json({ can_see_cost_price: true, can_see_customer_price: true });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.json({ can_see_cost_price: true, can_see_customer_price: true });
  }
});

// GET /api/settings
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query("SELECT key, value FROM system_settings WHERE key IN ('session_timeout','logo')");
    const settings = {};
    result.rows.forEach(r => settings[r.key] = r.value);
    res.json({
      session_timeout: settings.session_timeout || '30',
      logo: settings.logo || '',
    });
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
    const label = value === 0 || value === '0' ? 'Never' : `${value} minutes`;
    await logHistory(req.user?.id, 'UPDATE', 'setting', `Session Timeout → ${label}`, { value: label });
    res.json({ success: true, session_timeout: value });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save setting' });
  }
});

// PUT /api/settings/logo
router.put('/logo', auth, adminOnly, async (req, res) => {
  try {
    const { logo } = req.body;
    if (logo && logo.length > 700000) {
      return res.status(400).json({ error: 'Image too large. Max 500KB.' });
    }
    await pool.query(
      `INSERT INTO system_settings (key, value) VALUES ('logo', $1)
       ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`,
      [logo || '']
    );
    await logHistory(req.user?.id, logo ? 'UPDATE' : 'DELETE', 'setting', 'Sidebar Logo', { action: logo ? 'Logo uploaded' : 'Logo removed' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save logo' });
  }
});

module.exports = router;
