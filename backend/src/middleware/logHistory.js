const pool = require('../db/pool');

async function logHistory(userId, action, entityType, entityName, details) {
  try {
    await pool.query(
      `INSERT INTO change_history (user_id, action, entity_type, entity_name, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId || null, action, entityType, entityName, JSON.stringify(details || {})]
    );
  } catch (err) {
    console.error('History log error:', err.message);
  }
}

module.exports = logHistory;
