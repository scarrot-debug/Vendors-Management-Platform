# ONE Vendor Management Platform — Project Memory

## URLs
- **Production:** https://vendors.191.co.il
- **Frontend (Render):** https://vendor-frontend-68gz.onrender.com
- **Backend (Render):** https://vendor-backend-6gpd.onrender.com
- **GitHub:** https://github.com/scarrot-debug/Vendors-Management-Platform
- **Local:** http://localhost (Docker)

## Stack
- **Frontend:** React 18 + Vite, lucide-react icons, no UI library
- **Backend:** Node.js + Express, JWT auth, bcryptjs
- **Database:** PostgreSQL 16
- **Local:** Docker Compose (4 containers: frontend, backend, db, nginx)
- **Cloud:** Render.com (Static Site + Web Service + PostgreSQL Free)
- **DNS:** Cloudflare → vendors.191.co.il CNAME → vendor-frontend-68gz.onrender.com

## Project Structure
```
vendor-management/
├── frontend/
│   ├── src/
│   │   ├── api/client.js          ← API calls — MUST include addProduct!
│   │   ├── components/Layout.jsx  ← Sidebar navigation
│   │   ├── pages/
│   │   │   ├── Vendors.jsx        ← Main vendors table with drag&drop columns
│   │   │   ├── Dashboard.jsx      ← Charts and stats
│   │   │   ├── Settings.jsx       ← User management + change history
│   │   │   └── Login.jsx
│   │   ├── hooks/useAuth.jsx
│   │   └── version.js             ← Auto version from build date
│   ├── Dockerfile
│   └── nginx.conf
├── backend/
│   ├── src/
│   │   ├── index.js               ← App entry + DB auto-init on startup
│   │   ├── db/pool.js             ← ⚠️ CRITICAL: must have SSL line!
│   │   ├── routes/
│   │   │   ├── vendors.js         ← Distributors + products + export/history logging
│   │   │   ├── auth.js            ← Login (admin/admin123, viewer/viewer123)
│   │   │   ├── users.js           ← User management (admin only)
│   │   │   └── history.js         ← Change history endpoint
│   │   └── middleware/
│   │       ├── auth.js            ← JWT middleware
│   │       └── logHistory.js      ← Logs all changes to change_history table
│   ├── Dockerfile
│   └── package.json
├── db/
│   └── init.sql                   ← Local Docker DB seed only
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── setup-hooks.ps1                ← Run ONCE to activate git hooks
├── fix-ssl.ps1                    ← Manual SSL fix (backup)
└── .git-hooks/
    └── pre-push                   ← Auto-fixes pool.js SSL before every push
```

## Database Tables
- **distributors** — id, name, contact, email, phone, mobile, website, status, notes
- **products** — id, distributor_id (FK), name, category, vendor, cost, currency, status, description
- **users** — id, username, email, password_hash, role (admin/user/viewer)
- **change_history** — id, user_id, action, entity_type, entity_name, details, created_at

## ⚠️ Critical Known Issues

### 1. SSL — Most Common Problem
`backend/src/db/pool.js` MUST contain:
```javascript
ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : false,
```
**Symptom:** "Failed to create distributor" / SSL/TLS required in logs
**Fix:** Edit pool.js, add SSL line, git push, deploy Backend only

### 2. addProduct missing from client.js
`frontend/src/api/client.js` MUST contain:
```javascript
addProduct: (distId, data) => req(`/vendors/${distId}/products`, { method: 'POST', body: JSON.stringify(data) }),
```
**Symptom:** "addProduct is not a function" error
**Fix:** Add line to client.js, git push, deploy Frontend only

### 3. Git hooks not activated
After extracting archive, run ONCE:
```powershell
.\setup-hooks.ps1
```
Then SSL is fixed automatically before every push.

## Render.com Environment Variables (Backend)
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

## Render.com Environment Variables (Frontend)
```
VITE_API_URL = https://vendor-backend-6gpd.onrender.com/api
```

## Default Users
| Username | Password  | Role   |
|----------|-----------|--------|
| admin    | admin123  | admin  |
| viewer   | viewer123 | viewer |

## Deploy Process
```powershell
# After making changes:
git add .
git commit -m "description"
git push

# Then on Render:
# Backend changes  → Render > vendor-backend > Manual Deploy
# Frontend changes → Render > vendor-frontend > Manual Deploy > Clear build cache & deploy
# Both changed     → Deploy both
```

## Features Implemented
- ✅ Distributor management (CRUD) with website field
- ✅ Product management (CRUD) nested under distributors
- ✅ Hierarchical expandable table with Expand All / Collapse All
- ✅ Drag & Drop column reordering
- ✅ Sort by any column (click header)
- ✅ Global search (searches inside products too)
- ✅ Filter by status and category
- ✅ Page size selector: 10 / 25 / 50
- ✅ Export CSV / Import CSV
- ✅ Role-based access: Admin / User / Viewer
- ✅ User management in Settings
- ✅ Change history (all CREATE/UPDATE/DELETE)
- ✅ Analytics Dashboard with 5 chart types
- ✅ JWT authentication
- ✅ Custom domain vendors.191.co.il
- ✅ Auto-deploy from GitHub
- ✅ Auto version number in sidebar

## Local Docker Commands
```powershell
# Start
docker compose up --build

# Reset DB completely
docker compose down -v
docker compose up --build

# Check DB tables
docker exec vendor_db psql -U vendoruser -d vendordb -c "\dt"
```
