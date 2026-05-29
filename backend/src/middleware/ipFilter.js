const ALLOWED_IPS = [
  '31.154.240.84',
  '127.0.0.1',       // localhost
  '::1',             // localhost IPv6
  '::ffff:127.0.0.1' // localhost mapped
];

module.exports = (req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket.remoteAddress;

  if (ALLOWED_IPS.includes(ip)) return next();

  console.warn(`Blocked request from IP: ${ip}`);
  res.status(403).json({ error: 'Access denied' });
};
