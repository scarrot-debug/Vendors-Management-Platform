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
│   ├── api/client.js              ← ALL API calls — must stay complete!
│   ├── components/
│   │   ├── Layout.jsx             ← Sidebar + top bar + user dropdown
│   │   └── PageGuard.jsx          ← Page access protection component
│   ├── hooks/useAuth.jsx          ← Auth + session + logo + permissions
│   ├── pages/
│   │   ├── Vendors.jsx            ← Main table + docs panel + bulk actions
│   │   ├── Dashboard.jsx          ← Charts
│   │   ├── Settings.jsx           ← Users + categories + logo + history
│   │   ├── Catalog.jsx            ← Categories + Manufacturers management
│   │   ├── Requests.jsx           ← Purchase requests
│   │   ├── Approvals.jsx          ← Request approvals
│   │   ├── Profile.jsx            ← User profile
│   │   └── Login.jsx
│   ├── App.jsx                    ← Routes with PageGuard
│   └── version.js                 ← Auto version UTC+3
├── backend/src/
│   ├── index.js                   ← DB auto-init + all table creation
│   ├── db/pool.js                 ← ⚠️ CRITICAL: must have SSL line!
│   └── routes/
│       ├── vendors.js             ← Distributors + products + export + history
│       ├── auth.js                ← Login
│       ├── users.js               ← Users + /me routes BEFORE /:id
│       ├── history.js             ← Change history
│       ├── settings.js            ← Logo + timeout + categories + manufacturers + permissions
│       ├── documents.js           ← File upload/download/delete per distributor
│       └── requests.js            ← Purchase requests CRUD + approve/reject
├── .git-hooks/pre-push            ← Auto SSL fix before every push
├── setup-hooks.ps1                ← Run ONCE to activate hooks
├── MEMORY.md
└── README.md
```

## Database Tables
- **distributors** — id, name, contact, email, phone, mobile, website, status, notes
- **products** — id, distributor_id, name, category, vendor, cost, customer_price, currency, status, description
- **users** — id, username, email, password_hash, role, first_name, last_name, mobile, created_at
- **user_permissions** — user_id, can_see_cost_price, can_see_customer_price, can_see_documents, can_access_dashboard, can_access_vendors, can_access_catalog, can_access_requests, can_access_approvals
- **documents** — id, distributor_id, name, mime_type, size_bytes, data (base64), uploaded_by, created_at
- **requests** — id, title, distributor_id, requested_by, status (Draft/Pending/Approved/Rejected), notes, reviewer_notes, reviewed_by, reviewed_at
- **request_items** — id, request_id, product_name, quantity, notes
- **request_documents** — id, request_id, name, mime_type, size_bytes, data
- **change_history** — id, user_id, action, entity_type, entity_name, details, created_at
- **system_settings** — key (session_timeout, logo, categories, manufacturers), value, updated_at

## ⚠️ Critical Known Issues

### 1. SSL — Most Common Problem
`backend/src/db/pool.js` MUST contain:
```javascript
ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : false,
```
The pre-push hook fixes this automatically. If it fails, run `.\fix-ssl.ps1` manually.
Hook sometimes writes `module.exports = pool;` TWICE — fix by removing the duplicate.

### 2. settings.js confusion
`backend/src/routes/settings.js` must be Node.js/Express code starting with `const express = require('express')`.
NOT the React Settings.jsx frontend file! This has happened multiple times.

### 3. /me routes must be BEFORE /:id in users.js
`GET /api/users/me` and `PUT /api/users/me` must be defined BEFORE `/:id` routes.

### 4. Express JSON limit
`app.use(express.json({ limit: '15mb' }))` — required for document uploads.

### 5. Duplicate tables in index.js
When adding new tables, check for duplicates. requests/request_items/request_documents had duplicates causing SyntaxError.

### 6. Brace balance in JSX
Before pushing: verify Open braces === Close braces. Settings.jsx is most prone.

### 7. client.js duplicates
Check for duplicate API function names. getRequests was duplicated causing "not a function" error.

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

## Deploy Process
```powershell
git add .
git commit -m "description"
git push
# Backend changes  → Render > vendor-backend > Manual Deploy
# Frontend changes → Render > vendor-frontend > Manual Deploy > Clear build cache
# Both changed     → deploy both
```

## Features Implemented ✅
- Distributor + product CRUD with all fields
- Cost Price + Customer Price per product
- Hierarchical table with expand/collapse + Drag & Drop columns
- Sort by any column, global search, filter by status/category
- Page size: 10/25/50, Expand All/Collapse All
- Bulk Actions (select, change status, delete)
- Export CSV + Import CSV (distributors + products)
- Notes displayed as yellow row when distributor expanded
- Documents Panel per distributor (PDF/Word/Excel/Images, 10MB, Base64)
- Catalog page: Categories + Manufacturers management (add/edit/delete)
- Manufacturer dropdown in product form (from Catalog)
- Category dropdown in product form (from Catalog)
- Role-based access: Admin/User/Viewer
- Field-level permissions: Cost Price, Customer Price, Documents
- Page-level permissions: Dashboard, Vendors, Catalog, Requests, Approvals
- PageGuard: restricted pages show 🔒 placeholder instead of error
- Add User Wizard: 2-step (Details → Permissions) before creation
- User management table: Avatar + First Name + Last Name columns
- User profile (first/last name, mobile, email, password change)
- User dropdown → My Profile / Logout
- Change History (all actions logged)
- Session Timeout (global DB setting, 15min-Never)
- Sidebar Logo (Base64, 500KB max)
- Dashboard with 6 stat cards + 5 chart types
- Custom domain vendors.191.co.il
- Requests: create/edit/submit/delete purchase requests with items + attachments
- Approvals: review pending requests, approve/reject with reviewer notes
- Auto version UTC+3 in sidebar

## Request/Approval Flow
```
Create Request (Draft) → Submit → Pending → Admin/User Reviews → Approved/Rejected
```
- All users can create requests
- Admin + User role can approve/reject
- Only Draft requests can be edited/deleted
- Owner can submit own Draft
- Reviewer notes saved with decision
