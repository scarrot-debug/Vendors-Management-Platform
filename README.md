# ONE Vendor Management Platform

A full-stack vendor & product management system built from scratch.

🌐 **Live:** https://vendors.191.co.il  
📅 **Last Updated:** v20260526  
🔧 **Status:** Production

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, lucide-react |
| Backend | Node.js + Express |
| Database | PostgreSQL 16 |
| Local Dev | Docker Compose (4 containers) |
| Cloud | Render.com |
| DNS | Cloudflare → vendors.191.co.il |
| Auth | JWT + bcrypt |
| CI/CD | GitHub → Render auto-deploy |

---

## Features

### 🔐 Authentication & Security
- JWT login, bcrypt password hashing
- Role-based access: Admin / User / Viewer
- Auto logout after configurable inactivity (15min–Never, global)
- Viewer cannot access Settings

### 👥 User Management
- Add, edit, delete users + reset passwords
- Per-user field permissions: Cost Price / Customer Price / Documents
- User profile: first name, last name, mobile, email, password change
- User dropdown menu → My Profile / Logout

### 📋 Distributor Management
- Full CRUD — Name, Contact, Email, Phone, Mobile, Website, Notes, Status
- Notes displayed as yellow row when distributor is expanded
- Hierarchical table: expand distributor to see its products
- Expand All / Collapse All
- Drag & Drop column reordering
- Sort by any column
- Bulk Actions: select multiple → change status or delete

### 📦 Product Management
- Full CRUD per distributor
- Fields: Name, Manufacturer, Category (from managed list), Cost Price, Customer Price, Currency, Status, Description
- Field visibility controlled per user

### 📄 Documents Panel
- 📄 Docs button on every distributor row
- Floating panel (bottom-right, minimizable)
- Upload: PDF, Word, Excel, Images up to 10MB
- Viewer role: read-only (download only, no upload/delete)
- Stored as Base64 in PostgreSQL
- All actions logged in Change History

### 🔍 Search & Filter
- Global search (distributors + products + manufacturers + categories)
- Filter by Status and Category
- Page size: 10 / 25 / 50

### 📤 Export / Import
- Export CSV: all distributors + products (Cost Price, Customer Price)
- Import CSV: imports both distributors and products

### 📊 Dashboard
- 6 stat cards + 5 bar/donut charts
- Cost by category/distributor, products by category/distributor

### ⚙️ Settings
- User Management + field permissions per user
- Sidebar Logo (PNG/JPG/WebP/SVG, max 500KB)
- Session Timeout (global)
- Categories management (add/edit/delete)
- Change History (full audit log of all actions)

### 👤 Profile Page
- Personal info: first name, last name, mobile, email
- Change password (requires current password)

---

## Database Schema

| Table | Description |
|-------|-------------|
| `distributors` | Distributor records |
| `products` | Products per distributor |
| `users` | System users |
| `user_permissions` | Per-user field visibility |
| `documents` | Files per distributor (Base64) |
| `change_history` | Full audit log |
| `system_settings` | Logo, session timeout, categories |

---

## Local Development

```bash
docker compose up --build
docker compose down -v && docker compose up --build  # reset DB
```

## Deploy

```bash
git add . && git commit -m "description" && git push
# Backend → Render > vendor-backend > Manual Deploy
# Frontend → Render > vendor-frontend > Manual Deploy > Clear build cache
```

---

## Changelog

### v20260526
- Notes displayed as yellow row when distributor expanded
- Documents permission added to Role settings
- Viewer: read-only access to Documents (download only)
- Fix create user to save first/last name and mobile
- Fix /me routes order in users.js (before /:id)

### v20260525
- Documents Panel per distributor (upload/download/delete)
- Bulk Actions (select multiple, change status, delete)
- User Profile page + password change
- User dropdown menu
- Categories management in Settings
- Import CSV includes products
- Responsive layout
- Field-level permissions (Cost Price, Customer Price, Documents)

### v20260524
- Session timeout (global, DB)
- Sidebar logo upload
- Cost Price + Customer Price fields
- Category dropdown from managed list
- Detailed change history

### v20260523
- Export/Import CSV
- Global search, category filter
- Drag & Drop columns, sort, expand/collapse
- Dashboard charts
- Viewer restrictions

### v20260522
- Initial release
- Distributor & product management
- JWT auth, role-based access
- Docker + Render deployment
- Custom domain vendors.191.co.il
