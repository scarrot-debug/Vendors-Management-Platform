# ONE Vendor Management Platform

A full-stack vendor & product management system built from scratch.

🌐 **Live:** https://vendors.191.co.il  
📅 **Last Updated:** v20260528  
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
- Add User Wizard: 2-step flow (Details → Permissions) before creation
- Edit, delete users + reset passwords
- Per-user field permissions: Cost Price / Customer Price / Documents
- Per-user page permissions: Dashboard / Vendors / Catalog / Requests / Approvals
- PageGuard: restricted pages show 🔒 placeholder instead of error
- Users table: Avatar + First Name + Last Name + Username + Email + Role
- User profile: first name, last name, mobile, email, password change
- User dropdown menu → My Profile / Logout

### 📋 Distributor Management
- Full CRUD — Name, Contact, Email, Phone, Mobile, Website, Notes, Status
- Notes displayed as yellow row when distributor is expanded
- Hierarchical table: expand to see products
- Expand All / Collapse All, Drag & Drop column reordering
- Sort by any column, Bulk Actions (select, change status, delete)

### 📦 Product Management
- Full CRUD per distributor
- Fields: Name, Manufacturer (from Catalog), Category (from Catalog), Cost Price, Customer Price, Currency, Status, Description
- Field visibility controlled per user

### 📄 Documents Panel
- 📄 Docs button on every distributor row
- Floating panel (bottom-right, minimizable)
- Upload: PDF, Word, Excel, Images up to 10MB
- Viewer role: read-only (download only)
- Permission-controlled per user

### 📋 Requests (Purchase Requests)
- Any user can create a request
- Fields: Title, Distributor, Products + Quantity, Notes, Attachments
- Statuses: Draft → Pending → Approved / Rejected
- Owner can submit/delete own Draft requests

### ✅ Approvals
- Admin + User role can review Pending requests
- Approve or Reject with reviewer notes
- Full request details: items, attachments, notes
- Counter badge showing pending count

### 🔍 Search & Filter
- Global search (distributors + products + manufacturers + categories)
- Filter by Status and Category
- Page size: 10 / 25 / 50

### 📤 Export / Import
- Export CSV: all distributors + products
- Import CSV: imports both distributors and products

### 📊 Dashboard
- 6 stat cards + 5 bar/donut charts

### 📚 Catalog
- Categories management (add/edit/delete)
- Manufacturers management (add/edit/delete)
- Used as dropdowns in product forms

### ⚙️ Settings
- User Management + 2-step wizard for new users
- Field permissions + Page access per user
- Sidebar Logo (PNG/JPG/WebP/SVG, max 500KB)
- Session Timeout (global)
- Change History (full audit log)

---

## Database Schema

| Table | Description |
|-------|-------------|
| `distributors` | Distributor records |
| `products` | Products per distributor |
| `users` | System users |
| `user_permissions` | Field + page visibility per user |
| `documents` | Files per distributor (Base64) |
| `requests` | Purchase requests |
| `request_items` | Items per request |
| `request_documents` | Attachments per request |
| `change_history` | Full audit log |
| `system_settings` | Logo, session timeout, categories, manufacturers |

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

### v20260528
- Requests page: create/submit/delete purchase requests with items + attachments
- Approvals page: review/approve/reject pending requests with reviewer notes
- Page-level permissions per user (Dashboard/Vendors/Catalog/Requests/Approvals)
- PageGuard: blocked pages show 🔒 placeholder
- Add User Wizard: 2-step flow (Details → Permissions before creation)
- Users table: Avatar + First Name + Last Name columns
- User icon added to User Management section header

### v20260526
- Notes displayed as yellow row when distributor expanded
- Documents permission added to Role settings
- Viewer: read-only access to Documents
- Fix create user to save first/last name and mobile
- Manufacturer dropdown in product form (from Catalog)
- Catalog page activated with Categories + Manufacturers

### v20260525
- Documents Panel per distributor (upload/download/delete)
- Bulk Actions (select multiple, change status, delete)
- User Profile page + password change
- User dropdown menu
- Categories management in Settings → moved to Catalog
- Import CSV includes products
- Responsive layout
- Field-level permissions (Cost Price, Customer Price, Documents)

### v20260524
- Session timeout (global, DB)
- Sidebar logo upload
- Cost Price + Customer Price fields
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
