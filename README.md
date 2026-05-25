# ONE Vendor Management Platform

A full-stack vendor & product management system built from scratch.

🌐 **Live:** https://vendors.191.co.il

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL 16 |
| Local | Docker Compose |
| Cloud | Render.com |
| DNS | Cloudflare |
| Auth | JWT + bcrypt |

---

## Features

- 📋 Distributor & product management (CRUD)
- 🔍 Global search + filter by status & category
- 📊 Analytics dashboard with charts
- 👥 Role-based access: Admin / User / Viewer
- 📜 Full change history log
- 📤 Export / Import CSV (distributors + products)
- ⚙️ Settings: logo upload, session timeout, categories management
- 🔐 Auto logout after inactivity
- 🖱️ Drag & Drop column reordering
- ✅ Bulk Actions: select multiple distributors, change status or delete
- 📄 Documents Panel per distributor (PDF, Word, Excel, Images up to 10MB)
- 👤 User profile (first name, last name, mobile, password change)
- 🔒 Field-level permissions per user (Cost Price / Customer Price visibility)

---

## Changelog

### v20260525
- Added Documents Panel per distributor (upload, download, delete)
- Added Bulk Actions (select multiple, change status, delete)
- Added User Profile page with personal info and password change
- Added user dropdown menu (My Profile / Logout)
- Added Categories management in Settings (add/edit/delete)
- Added Import CSV for both distributors and products
- Responsive layout with horizontal scroll on small screens
- Black pagination buttons in Vendors and Settings
- Restricted document uploads to PDF, Word, Excel, images only
- Fixed field-level permissions per user (Cost Price / Customer Price)
- Added /me routes for profile before /:id routes
- Added minimize button to Documents Panel

### v20260524
- Added session timeout setting (global, stored in DB)
- Added sidebar logo upload (Base64, max 500KB)
- Added Never option to session timeout
- Full change history for all system actions
- Added customer price field (Cost Price + Customer Price) to products
- Added UTC+3 to version timestamp
- Category dropdown in product form from Settings list

### v20260523
- Added Export CSV / Import CSV
- Added global search (searches inside products)
- Added category filter
- Added drag & drop column reordering
- Added sort by any column
- Added Expand All / Collapse All
- Added page size selector (10/25/50)
- Added website field to distributors
- Added Change History in Settings
- Analytics Dashboard with 5 chart types
- Viewer role: hidden Settings menu
- Auto logout after inactivity (30 min default)

### v20260522
- Initial release
- Distributor & product management
- Role-based access control
- JWT authentication
- Docker Compose setup
- Render.com deployment
- Custom domain vendors.191.co.il

---

## Local Development

```bash
# Start
docker compose up --build

# Reset DB
docker compose down -v
docker compose up --build
```

## Deploy

```bash
git add .
git commit -m "description"
git push
# Render auto-deploys from GitHub
```
