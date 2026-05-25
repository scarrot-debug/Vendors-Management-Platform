const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const logHistory = require('../middleware/logHistory');

// GET /api/documents/:distributorId
router.get('/:distributorId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, mime_type, size_bytes, created_at,
              u.username as uploaded_by
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.distributor_id = $1
       ORDER BY d.created_at DESC`,
      [req.params.distributorId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// POST /api/documents/:distributorId
router.post('/:distributorId', auth, async (req, res) => {
  try {
    const { name, mime_type, size_bytes, data } = req.body;
    if (!name || !data) return res.status(400).json({ error: 'name and data are required' });
    // Max 10MB base64
    if (data.length > 14000000) return res.status(400).json({ error: 'File too large. Max 10MB.' });
    const dist = await pool.query('SELECT name FROM distributors WHERE id=$1', [req.params.distributorId]);
    const result = await pool.query(
      `INSERT INTO documents (distributor_id, name, mime_type, size_bytes, data, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, mime_type, size_bytes, created_at`,
      [req.params.distributorId, name, mime_type, size_bytes, data, req.user?.id || null]
    );
    await logHistory(req.user?.id, 'CREATE', 'document', name, { distributor: dist.rows[0]?.name });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// GET /api/documents/:distributorId/:docId/download
router.get('/:distributorId/:docId/download', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name, mime_type, data FROM documents WHERE id=$1 AND distributor_id=$2',
      [req.params.docId, req.params.distributorId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Document not found' });
    const { name, mime_type, data } = result.rows[0];
    const base64Data = data.includes(',') ? data.split(',')[1] : data;
    const buffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(name)}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// DELETE /api/documents/:distributorId/:docId
router.delete('/:distributorId/:docId', auth, async (req, res) => {
  try {
    const doc = await pool.query('SELECT name FROM documents WHERE id=$1', [req.params.docId]);
    const result = await pool.query(
      'DELETE FROM documents WHERE id=$1 AND distributor_id=$2 RETURNING id',
      [req.params.docId, req.params.distributorId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Document not found' });
    await logHistory(req.user?.id, 'DELETE', 'document', doc.rows[0]?.name, {});
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
