# ONE Vendor Management Platform — Project Memory

## URLs
- **Production:** https://vendors.191.co.il
- **Frontend (Render):** https://vendor-frontend-68gz.onrender.com
- **Backend (Render):** https://vendor-backend-6gpd.onrender.com
- **GitHub:** https://github.com/scarrot-debug/Vendors-Management-Platform
- **Local:** http://localhost (Docker)

## Stack
- Frontend: React 18 + Vite, lucide-react
- Backend: Node.js + Express, JWT, bcryptjs
- DB: PostgreSQL 16
- Local: Docker Compose (4 containers)
- Cloud: Render.com (Static Site + Web Service + PostgreSQL Free)
- DNS: Cloudflare → vendors.191.co.il

## Project Structure
```
vendor-management/
├── frontend/src/
│   ├── api/client.js          ← ALL API calls — must stay complete!
│   ├── components/Layout.jsx  ← Sidebar + top bar + user dropdown
│   ├── hooks/useAuth.jsx      ← Auth + session + logo + permissions
│   ├── pages/
│   │   ├── Vendors.jsx        ← Main table + docs panel + bulk actions
│   │   ├── Dashboard.jsx      ← Charts
│   │   ├── Settings.jsx       ← Users + categories + logo + history
│   │   ├── Profile.jsx        ← User profile
│   │   └── Login.jsx
│   ├── App.jsx                ← Routes
│   └── version.js             ← Auto version UTC+3
├── backend/src/
│   ├── index.js               ← DB auto-init + all table creation
│   ├── db/pool.js             ← ⚠️ CRITICAL: must have SSL line!
│   └── routes/
│       ├── vendors.js         ← Distributors + products + export + history
│       ├── auth.js            ← Login
│       ├── users.js           ← Users + /me routes BEFORE /:id
│       ├── history.js         ← Change history
│       ├── settings.js        ← Logo + timeout + categories + permissions
│       └── documents.js       ← File upload/download/delete
├── .git-hooks/pre-push        ← Auto SSL fix before every push
├── setup-hooks.ps1            ← Run ONCE to activate hooks
├── MEMORY.md
└── README.md
```

## Database Tables
- **distributors** — id, name, contact, email, phone, mobile, website, status, notes
- **products** — id, distributor_id, name, category, vendor, cost, customer_price, currency, status, description
- **users** — id, username, email, password_hash, role, first_name, last_name, mobile, created_at
- **user_permissions** — user_id, can_see_cost_price, can_see_customer_price, can_see_documents
- **documents** — id, distributor_id, name, mime_type, size_bytes, data (base64), uploaded_by, created_at
- **change_history** — id, user_id, action, entity_type, entity_name, details, created_at
- **system_settings** — key (session_timeout, logo, categories), value, updated_at

## ⚠️ Critical Known Issues

### 1. SSL — Most Common Problem
`backend/src/db/pool.js` MUST contain:
```javascript
ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : false,
```
The pre-push hook fixes this automatically. If it fails, run `.\fix-ssl.ps1` manually.

### 2. settings.js confusion
`backend/src/routes/settings.js` must be Node.js/Express code starting with `const express = require('express')`.
NOT the React Settings.jsx frontend file! This has happened multiple times.

### 3. /me routes must be BEFORE /:id in users.js
`GET /api/users/me` and `PUT /api/users/me` must be defined BEFORE `/:id` routes or Express interprets "me" as an ID.

### 4. Express JSON limit
`app.use(express.json({ limit: '15mb' }))` — required for document uploads.

### 5. Brace balance in JSX
Before pushing frontend changes, verify:
```javascript
// Open braces must equal close braces
// Settings.jsx and Vendors.jsx are most prone to this
```

### 6. duplicate module.exports in pool.js
The pre-push hook sometimes writes `module.exports = pool;` twice.
Fix: manually edit pool.js and remove the duplicate line.

## Render Environment Variables (Backend)
```
DB_HOST     = dpg-d887kaojo6nc73d93f90-a.frankfurt-postgres.render.com
DB_PORT     = 5432
DB_NAME     = vendor_db_b155
DB_USER     = vendor_db_b155_user
DB_PASSWORD = WOLyitXuSonqzktiACBgyLIWx34SabVp
JWT_SECRET  = supersecretjwtkey_change_me
NODE_ENV    = production
PORT        = 3001
```

## Render Environment Variables (Frontend)
```
VITE_API_URL = https://vendor-backend-6gpd.onrender.com/api
```

## Default Users
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| viewer | viewer123 | Viewer |

## Deploy Process
```powershell
git add .
git commit -m "description"
git push
# Backend changes  → Render > vendor-backend > Manual Deploy
# Frontend changes → Render > vendor-frontend > Manual Deploy > Clear build cache
# Both changed     → deploy both
```

## Features Implemented
- ✅ Distributor + product CRUD with all fields
- ✅ Cost Price + Customer Price per product
- ✅ Hierarchical table with expand/collapse
- ✅ Drag & Drop column reordering
- ✅ Sort by any column
- ✅ Global search (including products)
- ✅ Filter by status + category
- ✅ Page size: 10/25/50
- ✅ Bulk Actions (select, change status, delete)
- ✅ Export CSV + Import CSV (distributors + products)
- ✅ Documents Panel per distributor (PDF/Word/Excel/Images, 10MB)
- ✅ Notes displayed as yellow row when distributor expanded
- ✅ Role-based access: Admin/User/Viewer
- ✅ Field-level permissions: Cost Price, Customer Price, Documents
- ✅ User management + profile (first/last name, mobile)
- ✅ User dropdown → My Profile / Logout
- ✅ Change History (all actions logged)
- ✅ Session Timeout (global DB setting, 15min-Never)
- ✅ Sidebar Logo (Base64, 500KB max)
- ✅ Categories management in Settings
- ✅ Dashboard with 5 chart types
- ✅ Custom domain vendors.191.co.il
- ✅ Auto version UTC+3 in sidebar
- ✅ Viewer: no Settings access, Docs read-only

## TODO
- [ ] Remove DB_HOST from docker-compose.yml backend environment to fix local SSL issue
- [ ] Toast notifications in Vendors page (replace alert() with nice toasts)
- [ ] Notes field shown in distributor table (yellow row — DONE in Vendors.jsx)

## Local Docker Commands
```powershell
docker compose up --build
docker compose down -v && docker compose up --build  # reset DB
docker logs vendor_backend  # check errors
docker exec vendor_backend printenv DB_HOST  # should be empty locally
```
