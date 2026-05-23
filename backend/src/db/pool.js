const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'vendordb',
  user: process.env.DB_USER || 'vendoruser',
  password: process.env.DB_PASSWORD || 'vendorpass',
  ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected DB error', err);
});

module.exports = pool;
