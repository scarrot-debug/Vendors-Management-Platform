const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const logHistory = require('../middleware/logHistory');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validUUID = (id) => id && uuidRegex.test(id);

// GET /api/requests — list all requests (admin/user sees all, viewer sees own)
router.get('/', auth, async (req, res) => {
  try {
    const isViewer = req.user?.role === 'viewer';
    const query = isViewer
      ? `SELECT r.*, d.name as distributor_name, u.username as requester_name
         FROM requests r
         LEFT JOIN distributors d ON r.distributor_id = d.id
         LEFT JOIN users u ON r.requested_by = u.id
         WHERE r.requested_by = $1
         ORDER BY r.created_at DESC`
      : `SELECT r.*, d.name as distributor_name, u.username as requester_name
         FROM requests r
         LEFT JOIN distributors d ON r.distributor_id = d.id
         LEFT JOIN users u ON r.requested_by = u.id
         ORDER BY r.created_at DESC`;
    const params = isViewer ? [req.user.id] : [];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/requests/:id — get single request with items and documents
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, d.name as distributor_name, u.username as requester_name,
              rv.username as reviewer_name
       FROM requests r
       LEFT JOIN distributors d ON r.distributor_id = d.id
       LEFT JOIN users u ON r.requested_by = u.id
       LEFT JOIN users rv ON r.reviewed_by = rv.id
       WHERE r.id = $1`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Request not found' });
    const request = result.rows[0];

    const items = await pool.query('SELECT * FROM request_items WHERE request_id=$1 ORDER BY created_at', [req.params.id]);
    const docs = await pool.query('SELECT id, name, mime_type, size_bytes, created_at FROM request_documents WHERE request_id=$1', [req.params.id]);

    res.json({ ...request, items: items.rows, documents: docs.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// POST /api/requests — create new request
router.post('/', auth, async (req, res) => {
  try {
    const { title, distributor_id, notes, items, documents } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const userId = validUUID(req.user?.id) ? req.user.id : null;

    const result = await pool.query(
      `INSERT INTO requests (title, distributor_id, requested_by, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, distributor_id || null, userId, notes || null]
    );
    const request = result.rows[0];

    // Insert items
    if (items?.length) {
      for (const item of items) {
        await pool.query(
          `INSERT INTO request_items (request_id, product_name, quantity, notes) VALUES ($1,$2,$3,$4)`,
          [request.id, item.product_name, item.quantity || 1, item.notes || null]
        );
      }
    }

    // Insert documents
    if (documents?.length) {
      for (const doc of documents) {
        await pool.query(
          `INSERT INTO request_documents (request_id, name, mime_type, size_bytes, data) VALUES ($1,$2,$3,$4,$5)`,
          [request.id, doc.name, doc.mime_type, doc.size_bytes, doc.data]
        );
      }
    }

    await logHistory(userId, 'CREATE', 'request', title, { status: 'Draft' });
    res.status(201).json(request);
  } catch (err) {
    console.error('Create request error:', err.message);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// PUT /api/requests/:id — update draft request
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, distributor_id, notes, items } = req.body;
    const existing = await pool.query('SELECT * FROM requests WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });
    if (existing.rows[0].status !== 'Draft') return res.status(400).json({ error: 'Only Draft requests can be edited' });

    await pool.query(
      `UPDATE requests SET title=$1, distributor_id=$2, notes=$3, updated_at=NOW() WHERE id=$4`,
      [title, distributor_id || null, notes || null, req.params.id]
    );

    if (items) {
      await pool.query('DELETE FROM request_items WHERE request_id=$1', [req.params.id]);
      for (const item of items) {
        await pool.query(
          `INSERT INTO request_items (request_id, product_name, quantity, notes) VALUES ($1,$2,$3,$4)`,
          [req.params.id, item.product_name, item.quantity || 1, item.notes || null]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// POST /api/requests/:id/submit — submit for approval
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM requests WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    if (result.rows[0].status !== 'Draft') return res.status(400).json({ error: 'Only Draft requests can be submitted' });

    await pool.query(`UPDATE requests SET status='Pending', updated_at=NOW() WHERE id=$1`, [req.params.id]);
    await logHistory(req.user?.id, 'UPDATE', 'request', result.rows[0].title, { status: 'Pending' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// POST /api/requests/:id/approve
router.post('/:id/approve', auth, async (req, res) => {
  try {
    if (!['admin', 'user'].includes(req.user?.role)) return res.status(403).json({ error: 'Not authorized' });
    const { reviewer_notes } = req.body;
    const result = await pool.query('SELECT * FROM requests WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    if (result.rows[0].status !== 'Pending') return res.status(400).json({ error: 'Only Pending requests can be approved' });

    const reviewerId = validUUID(req.user?.id) ? req.user.id : null;
    await pool.query(
      `UPDATE requests SET status='Approved', reviewer_notes=$1, reviewed_by=$2, reviewed_at=NOW(), updated_at=NOW() WHERE id=$3`,
      [reviewer_notes || null, reviewerId, req.params.id]
    );
    await logHistory(req.user?.id, 'UPDATE', 'request', result.rows[0].title, { status: 'Approved' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// POST /api/requests/:id/reject
router.post('/:id/reject', auth, async (req, res) => {
  try {
    if (!['admin', 'user'].includes(req.user?.role)) return res.status(403).json({ error: 'Not authorized' });
    const { reviewer_notes } = req.body;
    const result = await pool.query('SELECT * FROM requests WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    if (result.rows[0].status !== 'Pending') return res.status(400).json({ error: 'Only Pending requests can be rejected' });

    const reviewerId = validUUID(req.user?.id) ? req.user.id : null;
    await pool.query(
      `UPDATE requests SET status='Rejected', reviewer_notes=$1, reviewed_by=$2, reviewed_at=NOW(), updated_at=NOW() WHERE id=$3`,
      [reviewer_notes || null, reviewerId, req.params.id]
    );
    await logHistory(req.user?.id, 'UPDATE', 'request', result.rows[0].title, { status: 'Rejected' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// DELETE /api/requests/:id — only draft, only owner or admin
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM requests WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    const req_ = result.rows[0];
    if (req_.status !== 'Draft') return res.status(400).json({ error: 'Only Draft requests can be deleted' });
    if (req_.requested_by !== req.user?.id && req.user?.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

    await pool.query('DELETE FROM requests WHERE id=$1', [req.params.id]);
    await logHistory(req.user?.id, 'DELETE', 'request', req_.title, {});
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// GET /api/requests/:id/documents/:docId/download
router.get('/:id/documents/:docId/download', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name, mime_type, data FROM request_documents WHERE id=$1 AND request_id=$2',
      [req.params.docId, req.params.id]
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

module.exports = router;
