# Project Approval Workflow System

A full-stack **Laravel 12 + React** application for submitting and managing project approvals with role-based access control, email notifications, and MySQL stored procedures.

---

##  Project Structure

```
project-approval-system/
├── backend/          ← Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AuthController.php      
│   │   │   └── ProjectController.php   
│   │   ├── Http/Requests/
│   │   │   ├── StoreProjectRequest.php
│   │   │   └── RejectProjectRequest.php
│   │   ├── Http/Resources/
│   │   │   └── ProjectResource.php
│   │   ├── Http/Middleware/
│   │   │   └── AdminMiddleware.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Project.php
│   │   │   ├── Approval.php
│   │   │   └── AuditLog.php
│   │   ├── Jobs/
│   │   │   └── SendProjectNotification.php  # Queued email job
│   │   ├── Notifications/
│   │   │   └── ProjectStatusNotification.php
│   │   └── Policies/
│   │       └── ProjectPolicy.php
│   ├── database/
│   │   ├── migrations/                  # All 6 table migrations
│   │   ├── seeders/DatabaseSeeder.php   # Demo users + projects
│   │   └── stored_procedures.sql        # sp_approve_project + sp_reject_project
│   └── routes/api.php
│
└── frontend/         ← React  + Bootstrap
    └── src/
        ├── api/index.js                 # Axios client + all API functions
        ├── contexts/AuthContext.jsx     # Global auth state
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx        # Stats + chart + quick actions
        │   ├── ProjectsPage.jsx         # Table + filters + bulk actions
        │   ├── SubmitProjectPage.jsx    # Form + drag-drop file upload
        │   └── ProjectDetailPage.jsx   # Detail + admin actions + audit log
        └── components/
            ├── layout/AppLayout.jsx    # Sidebar navigation
            └── shared/
                ├── StatusBadge.jsx
                └── LoadingScreen.jsx
```

---

##  Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Laravel 10, PHP 8.1+                |
| Auth      | Laravel Sanctum (Bearer tokens)     |
| Database  | MySQL 8+ with stored procedures     |
| Queue     | Laravel Database Queue              |
| Email     | Laravel Notifications (SMTP)        |
| Frontend  | React 18, Vite, React Router v6     |
| Styling   | Tailwind CSS 3                      |
| Forms     | React Hook Form                     |
| Charts    | Recharts                            |
| HTTP      | Axios with interceptors             |

---

##  Database Schema

```
users         — id, name, email, password, role(user|admin)
projects      — id, title, description, status, user_id, files(JSON), submitted_at
approvals     — id, project_id, admin_id, decision, reason, decided_at
audit_logs    — id, user_id, project_id, action, notes, ip_address, performed_at
```

---

##  API Endpoints

```
POST   /api/auth/register                # Register
POST   /api/auth/login                   # Login → returns Bearer token
POST   /api/auth/logout                  # Logout
GET    /api/auth/me                      # Current user

GET    /api/projects/stats               # Dashboard stats
GET    /api/projects?status=&search=&page= # List (paginated, filtered)
POST   /api/projects                     # Submit project (multipart)
GET    /api/projects/{id}               # Get project detail
DELETE /api/projects/{id}               # Delete pending project

PATCH  /api/projects/{id}/approve        # [Admin] Approve via stored proc
PATCH  /api/projects/{id}/reject         # [Admin] Reject via stored proc
POST   /api/projects/bulk-action         # [Admin] Bulk approve/reject
```

---

##  Quick Start

### Backend
```bash
cd backend
composer install
cp .env.example .env && php artisan key:generate
# Edit .env with DB credentials

php artisan migrate
php artisan db:seed
mysql -u root -p project_approval_db < database/stored_procedures.sql
php artisan storage:link
php artisan serve             
php artisan queue:work        
```

### Frontend
```bash
cd frontend
npm install
npm start                 
```

---

## 👥 Demo Accounts

| Role  | Email                | Password |
|-------|----------------------|----------|
| Admin | admin@example.com    | password |
| User  | alice@example.com    | password |
| User  | bob@example.com      | password |

---

##  Features Implemented

- [x] JWT/Token auth via Laravel Sanctum
- [x] Register & login pages with validation
- [x] Dashboard with stats (total/pending/approved/rejected + %)
- [x] Pie chart visualization (Recharts)
- [x] Project submission form with drag-and-drop file upload
- [x] Project list with filters (status, search), sort, pagination
- [x] Color-coded status badges
- [x] Admin approve/reject with reason input
- [x] Bulk approve/reject for admins
- [x] MySQL stored procedures (sp_approve_project, sp_reject_project)
- [x] Queued email notifications (submit/approve/reject)
- [x] Audit log timeline per project
- [x] Role-based access (Gates/Policies + Middleware)
- [x] API Resources (ProjectResource)
- [x] Responsive dark UI with sidebar navigation
