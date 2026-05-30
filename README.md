# School ERP SaaS

Multi-tenant School ERP platform for private schools, with per-school branding, theming, and optional custom domains.

## Overview

- Target audience: private schools currently using Excel for records, fees, marks, and attendance
- Goal: single codebase with branded experience for each school
- Each school can:
  - Use its own name and branding
  - Select or customize theme (colors, logo, layout)
  - Optionally use a custom domain
  - Access a dedicated institution dashboard

## Roles and capabilities

- Admin
  - School management and configuration
- Teachers
  - Add marks and attendance
  - Manage class data
  - Handle academic records
- Parents
  - Track student performance
  - Receive updates and notifications

## Admin side

- Separate admin dashboard for school management and configuration
- Built with React + Vite
- Talks to the same NestJS backend API

## Architecture and stack

- Frontend (public portal): Next.js (apps/school-erp)
- Admin dashboard: React + Vite (apps/erp_admin)
- Backend (public): NestJS (apps/school-erp-backend)
- Backend (admin): NestJS (apps/erp_admin_backend)
- Database: PostgreSQL
- ORM: Prisma
- Deployment: Docker
- Reverse proxy: Nginx

## Repository structure

```
apps/
  school-erp/            # Next.js frontend
  school-erp-backend/    # NestJS backend (public)
  erp_admin/             # React + Vite admin dashboard
  erp_admin_backend/     # NestJS backend (admin)
deploy/
```

## Local development

### 1) Install dependencies

```bash
cd apps/school-erp
npm install

cd ../school-erp-backend
npm install
```

### 2) Configure environment variables

Create .env files for local development.

apps/school-erp-backend/.env

```
PORT=3001
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/school_erp"
```

apps/erp_admin_backend/.env

```
PORT=3002
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/school_erp"
```

apps/school-erp/.env.local

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

apps/erp_admin/.env

```
VITE_API_BASE_URL=http://localhost:3001
```

### 3) Prisma setup and usage

If Prisma is not installed in the backend yet, add it:

```bash
cd apps/school-erp-backend
npm install prisma @prisma/client
npx prisma init
```

Common Prisma commands:

```bash
# Create and apply a migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Run seeds (if configured)
npx prisma db seed
```

### 4) Run the apps

```bash
cd apps/school-erp-backend
npm run start:dev
```

```bash
cd apps/erp_admin_backend
npm run start:dev
```

```bash
cd apps/school-erp
npm run dev
```

```bash
cd apps/erp_admin
npm run dev
```

Note: the backend defaults to port 3000 if PORT is not set. Use PORT=3001 (or another port) to avoid conflict with the Next.js dev server.

## Deployment notes (Docker + Nginx)

- Build frontend and backend Docker images
- Run Postgres as a separate container or managed service
- Use Nginx as a reverse proxy to route:
  - / -> frontend
  - /api -> backend
- Configure HTTPS and custom domains per school if needed

## Roadmap (future expansions)

- SMS/WhatsApp notifications
- Fee management and online payments
- Transport and timetable modules
- Advanced analytics dashboards
