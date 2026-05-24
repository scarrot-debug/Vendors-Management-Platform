const pool = require('../db/pool');

async function logHistory(userId, action, entityType, entityName, details) {
  try {
    // Validate userId is a proper UUID, otherwise set to null
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUserId = userId && uuidRegex.test(userId) ? userId : null;

    await pool.query(
      `INSERT INTO change_history (user_id, action, entity_type, entity_name, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [validUserId, action, entityType, entityName, JSON.stringify(details || {})]
    );
  } catch (err) {
    console.error('History log error:', err.message);
  }
}

module.exports = logHistory;
