# Environment Configuration & Local Setup Guide

AcademiX uses a **Single Unified Root Environment File** (`.env`) symlinked across both backend and frontend applications. Editing this one file configures the entire stack.

---

## 1. Single Root `.env` Reference

Location: [`/mnt/drive4/School_epr_system/.env`](../.env)

```ini
# ==============================================================================
# AcademiX Multi-Tenant School ERP - Central Unified Environment Configuration
# ==============================================================================

# Server Configuration
PORT=3001
NODE_ENV=development

# 1. PostgreSQL Database (Prisma ORM)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/school_erp?schema=public"

# 2. MongoDB Database (Mongoose ODM)
MONGODB_URI="mongodb://localhost:27017/school_erp"

# 3. Redis (Cache, Sessions & PubSub)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_URL="redis://localhost:6379"

# Security & Authentication
JWT_SECRET="academix_ultra_secure_jwt_secret_key_2026_school_erp_system"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="academix_ultra_secure_jwt_refresh_token_secret_2026"
BCRYPT_SALT_ROUNDS=10

# Frontend Client Configuration (Next.js browser client)
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001/api"
NEXT_PUBLIC_WS_BASE_URL="ws://localhost:3001"
NEXT_PUBLIC_APP_NAME="AcademiX ERP"
NEXT_PUBLIC_DEFAULT_SCHOOL_CODE="OAK-RIDGE"
```

---

## 2. Starting the Tri-Database Stack (Docker Compose)

A complete local database stack (PostgreSQL 16, MongoDB 7.0, Redis 7.0) is configured in [`docker-compose.yml`](../docker-compose.yml).

### Start Databases:
```bash
docker compose up -d
```

### Stop Databases:
```bash
docker compose down
```

### Check Database Health:
```bash
docker compose ps
```

---

## 3. Database Migrations & Seeding

### Apply PostgreSQL Prisma Migrations:
```bash
cd apps/school-erp-backend
npx prisma migrate dev --name init
npx prisma generate
```

### Seed Realistic Demo Data:
You can seed sample schools, SuperAdmins, Admins, Teachers, Students, Parents, Timetables, Marks, Attendance, and Fees in two ways:

1. **Via CLI:**
   ```bash
   cd apps/school-erp-backend
   npx ts-node prisma/seed.ts
   ```
2. **Via HTTP Endpoint:**
   ```bash
   curl -X POST http://localhost:3001/api/seed/demo
   ```

### Default Seed Credentials:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@academix.com` | `SuperAdmin@123` |
| **School Admin** | `admin@oakridge.edu` | `Admin@123` |
| **Teacher** | `sarah@oakridge.edu` | `Teacher@123` |
| **Student** | `alice@oakridge.edu` | `Student@123` |
| **Parent** | `robert.parent@oakridge.edu` | `Parent@123` |

---

## 4. Running Backend & Frontend in Development

### Run NestJS Backend:
```bash
cd apps/school-erp-backend
npm run start:dev
```
*API is accessible at: `http://localhost:3001/api`*

### Run Next.js Frontend:
```bash
cd apps/school-erp
npm run dev
```
*Web app is accessible at: `http://localhost:3000`*
