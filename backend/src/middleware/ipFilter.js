const pool = require('../db/pool');

const ALWAYS_ALLOWED = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

module.exports = async (req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket.remoteAddress;

  if (ALWAYS_ALLOWED.includes(ip)) return next();

  try {
    const result = await pool.query("SELECT value FROM system_settings WHERE key='allowed_ips'");
    const allowedIps = result.rows[0]?.value ? JSON.parse(result.rows[0].value) : [];

    // If list is empty — allow all
    if (allowedIps.length === 0) return next();

    if (allowedIps.includes(ip)) return next();

    console.warn(`Blocked request from IP: ${ip}`);
    return res.status(403).json({ error: 'Access denied' });
  } catch (err) {
    // On DB error — allow through to avoid lockout
    console.error('ipFilter DB error:', err.message);
    return next();
  }
};
