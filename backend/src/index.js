const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
const vendorRoutes = require('./routes/vendors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const historyRoutes = require('./routes/history');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize DB tables on startup
async function initDB() {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS distributors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(200) NOT NULL,
        contact VARCHAR(200),
        email VARCHAR(200),
        phone VARCHAR(100),
        mobile VARCHAR(100),
        website VARCHAR(300),
        status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Inactive')),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    // Add website column if not exists (for existing DBs)
    await pool.query(`ALTER TABLE distributors ADD COLUMN IF NOT EXISTS website VARCHAR(300)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100),
        vendor VARCHAR(200),
        cost NUMERIC(12,2),
        customer_price NUMERIC(12,2),
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Inactive')),
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    // Add customer_price if not exists (for existing DBs)
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS customer_price NUMERIC(12,2)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(200) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'user', 'viewer')),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        mobile VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(50)`);

    // Seed admin user (password: admin123)
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@one.local', '$2b$10$rOzJqLwZQjKqLwZQjKqLwOuB5VBt9Pq1NrLq5X9y7T2mA3W8K1vQe', 'admin')
      ON CONFLICT DO NOTHING
    `);

    // Seed viewer user (password: viewer123)
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('viewer', 'viewer@one.local', '$2b$10$rOzJqLwZQjKqLwZQjKqLwOuB5VBt9Pq1NrLq5X9y7T2mA3W8K1vQe', 'viewer')
      ON CONFLICT DO NOTHING
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS change_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_name VARCHAR(200),
        details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        can_see_cost_price BOOLEAN NOT NULL DEFAULT true,
        can_see_customer_price BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Default session timeout: 30 minutes
    await pool.query(`
      INSERT INTO system_settings (key, value) VALUES ('session_timeout', '30')
      ON CONFLICT DO NOTHING
    `);

    // Default logo: empty
    await pool.query(`
      INSERT INTO system_settings (key, value) VALUES ('logo', '')
      ON CONFLICT DO NOTHING
    `);

    console.log('DB initialized successfully');
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: 'v1.20260522.12' }));

app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/settings', settingsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`ONE Vendor Management API running on port ${PORT}`);
  await initDB();
});
// Settings routes added below
