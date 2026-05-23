-- ONE Vendor Management - Database Init

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS distributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  contact VARCHAR(200),
  email VARCHAR(200),
  phone VARCHAR(100),
  mobile VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  vendor VARCHAR(200),
  cost NUMERIC(12,2),
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Inactive')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
INSERT INTO users (username, email, password_hash, role) VALUES
  ('admin',  'admin@one.local',  '$2b$10$rOzJqLwZQjKqLwZQjKqLwOuB5VBt9Pq1NrLq5X9y7T2mA3W8K1vQe', 'admin'),
  ('viewer', 'viewer@one.local', '$2b$10$rOzJqLwZQjKqLwZQjKqLwOuB5VBt9Pq1NrLq5X9y7T2mA3W8K1vQe', 'viewer')
ON CONFLICT DO NOTHING;

-- Distributors
INSERT INTO distributors (id, name, contact, email, phone, status, notes) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Arrow ECS',         'Yossi Levi',   'yossi@arrowecs.co.il',   '03-1234567', 'Active',   'Networking distributor'),
  ('a1000000-0000-0000-0000-000000000002', 'Exclusive Networks', 'Dana Cohen',   'dana@exclusive.co.il',   '03-2345678', 'Active',   'Security distributor'),
  ('a1000000-0000-0000-0000-000000000003', 'Cloud Zone',        'Amit Shahar',  'amit@cloudzone.co.il',   '03-3456789', 'Pending',  'Cloud distributor'),
  ('a1000000-0000-0000-0000-000000000004', 'Taldor',            'Michael Tan',  'michael@taldor.co.il',   '03-4567890', 'Active',   'Storage distributor'),
  ('a1000000-0000-0000-0000-000000000005', 'Comstor',           'Nir Malka',    'nir@comstor.co.il',      '03-5678901', 'Inactive', 'Backup distributor'),
  ('a1000000-0000-0000-0000-000000000006', 'Ofek',              'Avi Cohen',    'avi@ofek.co.il',         '03-6789012', 'Active',   'Security & Remote tools')
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (distributor_id, name, category, vendor, cost, currency, status, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Catalyst 9000',      'Networking', 'Cisco',              12500.00, 'USD', 'Active',   'Enterprise switching platform'),
  ('a1000000-0000-0000-0000-000000000001', 'ISR 4000 Router',    'Networking', 'Cisco',               8200.00, 'USD', 'Active',   'Integrated services router'),
  ('a1000000-0000-0000-0000-000000000002', 'PA-3400 Series',     'Security',   'Palo Alto Networks', 18000.00, 'USD', 'Active',   'Next-gen firewall'),
  ('a1000000-0000-0000-0000-000000000002', 'Prisma Access',      'Security',   'Palo Alto Networks',   450.00, 'USD', 'Active',   'Cloud SASE platform (per user/yr)'),
  ('a1000000-0000-0000-0000-000000000003', 'EC2 Reserved',       'Cloud',      'AWS',                  320.00, 'USD', 'Pending',  'Reserved compute instances'),
  ('a1000000-0000-0000-0000-000000000003', 'S3 Storage',         'Cloud',      'AWS',                   23.00, 'USD', 'Pending',  'Object storage per TB/month'),
  ('a1000000-0000-0000-0000-000000000004', 'PowerStore 500T',    'Storage',    'Dell EMC',            35000.00, 'USD', 'Active',   'All-flash storage array'),
  ('a1000000-0000-0000-0000-000000000005', 'Veeam B&R Universal','Backup',     'Veeam',                 580.00, 'USD', 'Inactive', 'Backup & replication license'),
  ('a1000000-0000-0000-0000-000000000006', 'SentinelOne',        'Security',   'SentinelOne',           72.00, 'USD', 'Active',   'Endpoint protection (per endpoint/yr)'),
  ('a1000000-0000-0000-0000-000000000006', 'RMM',                'Management', 'NinjaRMM',              45.00, 'USD', 'Active',   'Remote monitoring & management'),
  ('a1000000-0000-0000-0000-000000000006', 'Anydesk',            'Remote',     'Anydesk',               18.00, 'USD', 'Active',   'Remote desktop access (per user/yr)')
ON CONFLICT DO NOTHING;
