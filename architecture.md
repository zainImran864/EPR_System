# Architecture

## System overview

Multi-tenant School ERP SaaS platform. Each school gets isolated data, custom branding, and an optional custom domain — all served from a single codebase.

## Applications

| App | Path | Tech | Purpose |
|-----|------|------|---------|
| School portal | `apps/school-erp` | Next.js | School-facing product for admins/principals, teachers, parents, students |
| Admin dashboard | `apps/erp_admin` | React + Vite | Internal platform app for tracking schools, subscriptions, and usage |
| Public API | `apps/school-erp-backend` | NestJS | Serves the school portal; port 3001 |
| Admin API | `apps/erp_admin_backend` | NestJS | Serves the admin dashboard; port 3002 |

## Data layer

- **Database**: PostgreSQL (shared instance, tenant-isolated by school ID)
- **ORM**: Prisma (schema lives in `apps/school-erp-backend`)
- Both backends share the same database but the admin backend has elevated privileges for cross-tenant operations

## Frontend data flow

Backend responses are fetched in `api/` (feature helpers), mapped into shared `types/`, consumed by `hooks/`, and stored in `store/` using Zustand where app-wide state is required. UI components render from hooks/store state.

## Multi-tenancy

Each school record stores:
- Name and branding (logo, colors, layout)
- Optional custom domain
- Tenant ID used to scope all queries

Custom domain routing is handled at the Nginx layer — a request for `school.example.com` is resolved to the correct tenant before hitting the Next.js app.

## Request flow

```
Browser
  │
  ▼
Nginx (reverse proxy)
  ├── /          → Next.js school portal (apps/school-erp)
  ├── /api       → NestJS public API    (apps/school-erp-backend)
  ├── /admin     → React admin SPA      (apps/erp_admin)
  └── /admin/api → NestJS admin API     (apps/erp_admin_backend)
```

## Roles

| Role | Capabilities |
|------|-------------|
| Admin | School creation, branding config, user management |
| Teacher | Marks entry, attendance, class and academic records |
| Parent | Read-only: student performance, notifications |

## Deployment

- Each app is containerized (Docker)
- PostgreSQL runs as a separate container or managed service
- Nginx handles TLS termination, routing, and custom domain resolution
- Environment variables configure API URLs and database connections per environment

## Environment variables

| App | Variable | Example |
|-----|----------|---------|
| `school-erp-backend` | `PORT` | `3001` |
| `school-erp-backend` | `DATABASE_URL` | `postgresql://user:pass@host:5432/school_erp` |
| `erp_admin_backend` | `PORT` | `3002` |
| `erp_admin_backend` | `DATABASE_URL` | `postgresql://user:pass@host:5432/school_erp` |
| `school-erp` | `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3001` |
| `erp_admin` | `VITE_API_BASE_URL` | `http://localhost:3001` |

## Planned modules (roadmap)

- SMS / WhatsApp notifications
- Fee management and online payments
- Transport and timetable modules
- Advanced analytics dashboards
