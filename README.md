# ONE Vendor Management Platform

A full-stack vendor & product management system built from scratch.

🌐 **Live:** https://vendors.191.co.il  
📅 **Last Updated:** v20260525  
🔧 **Status:** Production

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, lucide-react |
| Backend | Node.js + Express |
| Database | PostgreSQL 16 |
| Local Dev | Docker Compose (4 containers) |
| Cloud | Render.com (Static Site + Web Service + PostgreSQL) |
| DNS | Cloudflare → vendors.191.co.il |
| Auth | JWT + bcrypt |
| CI/CD | GitHub → Render auto-deploy |

---

## System Features

### 🔐 Authentication & Security
- JWT-based login with 8-hour token expiry
- bcrypt password hashing
- Role-based access control: **Admin / User / Viewer**
- Auto logout after configurable inactivity period
- Session timeout: 15min / 30min / 45min / 1hr / 2hr / 3hr / Never (global, stored in DB)
- Viewer role cannot access Settings page

### 👥 User Management (Admin only)
- Add, edit, delete users
- Reset any user's password
- Set user role: Admin / User / Viewer
- Set per-user field permissions (Cost Price / Customer Price visibility)
- User profile: first name, last name, mobile, email
- User dropdown menu → My Profile / Logout
- Change own password from profile page

### 📋 Distributor Management
- Full CRUD (Create, Read, Update, Delete)
- Fields: Name, Contact Person, Email, Phone, Mobile, Website (clickable link)
- Status: Active / Pending / Inactive with color badges
- Hierarchical table — expand distributor to see its products
- Expand All / Collapse All in one click
- Drag & Drop column reordering
- Sort by any column (ascending/descending)
- Select multiple distributors with checkboxes (Bulk Actions)

### 📦 Product Management
- Full CRUD per distributor
- Fields: Name, Manufacturer, Category, Cost Price, Customer Price, Currency (USD/EUR/ILS/GBP), Status, Description
- Category selected from managed list (not free text)
- Cost Price and Customer Price shown in color-coded columns
- Field-level visibility permissions per user

### ✅ Bulk Actions
- Select multiple distributors with checkboxes
- Select All / Deselect All
- Bulk change status: Active / Pending / Inactive
- Bulk delete with confirmation modal

### 🔍 Search & Filter
- Global search — searches distributor name, contact, email AND product names, manufacturer, category
- Clear search with X button
- Filter by Status (All / Active / Pending / Inactive)
- Filter by Category (loaded from managed list)
- Page size selector: 10 / 25 / 50 rows per page
- Refresh button

### 📄 Documents Panel (per Distributor)
- Click 📄 Docs button on any distributor row
- Floating panel opens bottom-right (minimizable)
- Upload files: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), Images (PNG/JPG/WEBP/GIF)
- Max file size: 10MB
- Files stored as Base64 in PostgreSQL
- Shows: filename, size, upload date, uploaded by
- Download any document
- Delete any document
- All uploads/deletions logged in Change History

### 📊 Analytics Dashboard
- 6 stat cards: Total Distributors, Active, Pending, Inactive, Total Products, Total Cost
- Donut chart: distributor status breakdown
- Bar chart: products per distributor
- Bar chart: cost by category
- Bar chart: cost by distributor
- Bar chart: products by category

### 📤 Export / Import
- **Export CSV**: all distributors + products in one file (includes Cost Price, Customer Price)
- **Import CSV**: imports both distributors and products (2-pass: creates distributors first, then products)
- CSV format includes: Distributor, Status, Contact, Email, Phone, Mobile, Website, Product, Manufacturer, Category, Cost Price, Customer Price, Currency, Product Status, Description

### 📜 Change History (Settings)
- Logs every action in the system
- Tracks: CREATE / UPDATE / DELETE
- Covers: distributors, products, users, settings (logo, session timeout, categories), documents
- Shows: date/time, username, action type, entity type, entity name
- Paginated view (20 per page)
- Detailed entries e.g. "Session Timeout → 45 minutes", "cost_price: hidden"

### ⚙️ Settings Page (Admin)
- **User Management**: add/edit/delete users, reset passwords, set permissions
- **Field Permissions per User**: toggle Cost Price / Customer Price visibility per user
- **Sidebar Logo**: upload custom logo (PNG/JPG/WEBP/SVG up to 500KB), remove to restore default
- **Session Timeout**: global setting affecting all users
- **Categories Management**: add/edit/delete product categories used across the system
- **Change History**: full audit log

### 👤 User Profile Page
- Access via user dropdown menu (top right)
- Edit: first name, last name, mobile, email
- Change own password (requires current password)

### 🎨 UI/UX
- Responsive layout with horizontal scroll on narrow screens
- Drag & Drop column reordering in vendor table
- Black action buttons throughout (Add, Save, Login)
- Color-coded status badges (green/yellow/gray)
- Cost Price in dark color, Customer Price in green
- Version number displayed in sidebar (UTC+3 timestamp)
- Sidebar collapses to icon-only mode
- Custom logo in sidebar (global setting)
- Documents panel minimizable to header-only

---

## Database Schema

| Table | Description |
|-------|-------------|
| `distributors` | Distributor records |
| `products` | Products linked to distributors |
| `users` | System users with roles |
| `user_permissions` | Per-user field visibility settings |
| `documents` | Files attached to distributors (Base64) |
| `change_history` | Audit log of all system actions |
| `system_settings` | Global settings (logo, session timeout, categories) |

---

## Project Structure

```
vendor-management/
├── frontend/
│   ├── src/
│   │   ├── api/client.js       ← All API calls
│   │   ├── components/Layout.jsx
│   │   ├── hooks/useAuth.jsx   ← Auth + permissions + logo + session
│   │   ├── pages/
│   │   │   ├── Vendors.jsx     ← Main table + Documents Panel
│   │   │   ├── Dashboard.jsx   ← Charts
│   │   │   ├── Settings.jsx    ← Users + categories + logo + history
│   │   │   ├── Profile.jsx     ← User profile
│   │   │   └── Login.jsx
│   │   └── version.js          ← Auto version (UTC+3)
├── backend/
│   ├── src/
│   │   ├── index.js            ← App entry + DB init
│   │   ├── db/pool.js          ← PostgreSQL connection (SSL conditional)
│   │   ├── middleware/
│   │   │   ├── auth.js         ← JWT middleware
│   │   │   └── logHistory.js   ← Audit logging
│   │   └── routes/
│   │       ├── vendors.js      ← Distributors + products + export
│   │       ├── auth.js         ← Login
│   │       ├── users.js        ← User management + profile
│   │       ├── history.js      ← Change history
│   │       ├── settings.js     ← Logo + timeout + categories + permissions
│   │       └── documents.js    ← File upload/download/delete
├── .git-hooks/pre-push         ← Auto SSL fix before push
├── setup-hooks.ps1             ← Run once to activate hooks
└── README.md
```

---

## Local Development

```bash
# Start all services
docker compose up --build

# Reset database completely
docker compose down -v
docker compose up --build

# Rebuild backend only
docker compose build --no-cache backend
docker compose up
```

## Deploy to Production

```bash
# After making changes:
git add .
git commit -m "description"
git push
# Then in Render:
# Backend changes → vendor-backend → Manual Deploy
# Frontend changes → vendor-frontend → Manual Deploy → Clear build cache
# Both changed → deploy both
```

---

## Render.com Environment Variables

### Backend (vendor-backend)
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

### Frontend (vendor-frontend)
```
VITE_API_URL = https://vendor-backend-6gpd.onrender.com/api
```

---

## Changelog

### v20260525
- Documents Panel per distributor (upload/download/delete, PDF/Word/Excel/Images, 10MB max)
- Bulk Actions: select multiple distributors, change status or delete
- User Profile page (personal info + password change)
- User dropdown menu (My Profile / Logout)
- Categories management in Settings (add/edit/delete)
- Import CSV includes both distributors and products
- Responsive layout with horizontal scroll
- Black pagination buttons
- Restrict document uploads to allowed types only
- Field-level permissions per user (Cost Price / Customer Price)
- Fixed /me routes before /:id in backend
- Minimize button on Documents Panel

### v20260524
- Session timeout (global DB setting): 15/30/45min/1hr/2hr/3hr/Never
- Sidebar logo upload (Base64, max 500KB)
- Cost Price + Customer Price fields on products
- Category dropdown from managed list
- Detailed change history for all actions
- UTC+3 version timestamp

### v20260523
- Export/Import CSV
- Global search (including products)
- Category filter
- Drag & Drop column reordering
- Sort by any column
- Expand/Collapse All
- Page size: 10/25/50
- Website field on distributors
- Change History in Settings
- Dashboard with 5 chart types
- Viewer cannot access Settings
- Auto logout after inactivity

### v20260522
- Initial release
- Distributor & product management
- Role-based access (Admin/User/Viewer)
- JWT authentication
- Docker Compose local dev
- Render.com production deployment
- Custom domain vendors.191.co.il