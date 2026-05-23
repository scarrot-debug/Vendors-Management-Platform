const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// GET /api/history
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const countRes = await pool.query('SELECT COUNT(*) FROM change_history');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query(
      `SELECT h.*, u.username FROM change_history h
       LEFT JOIN users u ON h.user_id = u.id
       ORDER BY h.created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );
    res.json({ history: result.rows, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
