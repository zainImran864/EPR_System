# System Architecture & Technology Stack

## 1. High-Level Architectural Overview

AcademiX is an enterprise-grade, multi-tenant School ERP SaaS platform designed for high performance, modularity, and future distribution as a desktop installer (`.exe` / `.msi` for Windows, `.deb` for Ubuntu).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT TIER (Next.js 16)                         │
│  - SuperAdmin Portal (/superadmin)      - Teacher Portal (/teacher)         │
│  - School Admin Portal (/admin)         - Student Portal (/student)         │
│  - Parent Portal (/parent)              - Document Print Views (/print)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (JSON) + WebSocket (Live Sync)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY / NESTJS BACKEND                      │
│  Global Interceptors: TransformInterceptor (Envelope), AllExceptionsFilter  │
│  Global Pipes: ValidationPipe (class-validator / DTOs)                      │
│  Security: Passport JWT Strategy, RolesGuard (RBAC), TenantGuard            │
├─────────────────────────────────────────────────────────────────────────────┤
│                         MODULAR DOMAIN SERVICES                             │
│  AuthModule | SchoolsModule | UsersModule | ClassesModule | TeachersModule  │
│  StudentsModule | AttendanceModule | MarksModule | FeesModule               │
│  TimetableModule | NotificationsModule | AuditModule | DashboardModule      │
└──────────────┬───────────────────────────────┬──────────────────────────────┘
               │                               │
       ┌───────┴────────┐              ┌───────┴────────┐              ┌──────────────┐
       ▼                ▼              ▼                ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│  PostgreSQL  │ │   Prisma     │ │   MongoDB    │ │   Mongoose   │ │     Redis 7      │
│  16 (ACID)   │ │    ORM       │ │ 7.0 (Docs)   │ │     ODM      │ │ (Cache & PubSub) │
│ Relational   │ │ Structured   │ │ Audit Logs   │ │ Append-Only  │ │ Sub-millisecond  │
│ Entities     │ │ Data Models  │ │ Notifications│ │ Event Docs   │ │ Response Times   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘
```

---

## 2. Tri-Database Layer

### A. PostgreSQL 16 (Primary Relational Engine)
- **ORM:** Prisma Client
- **Schema:** [`apps/school-erp-backend/prisma/schema.prisma`](../apps/school-erp-backend/prisma/schema.prisma)
- **Entities Handled:**
  - `School`: Multi-tenant root, custom domain, branding colors, SMTP.
  - `User` & `Session`: User accounts across all roles, password hashes (bcrypt), 2FA state.
  - `Class`, `Section`, `Subject`: Academic taxonomy and capacities.
  - `Teacher` & `Student`: Faculty and student rosters with auto-generated IDs (`EMP-001`, `ADM-2026-001`).
  - `Parent`: Linked parent profiles sharing authentication with students.
  - `Attendance`: Daily and period attendance records (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`).
  - `ExamTerm` & `Mark`: Examination periods, scores, auto grades (`A+` to `F`), and report cards.
  - `FeeChallan`: Monthly tuition and term bills with payment reconciliation.
  - `TimetableEntry`: Period schedule slots with collision prevention.

### B. MongoDB 7.0 (Document & Event Store)
- **ODM:** NestJS Mongoose
- **Schemas:** [`apps/school-erp-backend/src/database/schemas/`](../apps/school-erp-backend/src/database/schemas/)
- **Collections Handled:**
  - `audit_logs`: Detailed immutable audit trail of who created, edited, or deleted records.
  - `notifications`: Rich-text announcements, targeted class/role alerts, and read receipts.

### C. Redis 7.0 (High-Speed In-Memory Cache & Pub/Sub)
- **Service:** [`apps/school-erp-backend/src/database/redis.service.ts`](../apps/school-erp-backend/src/database/redis.service.ts)
- **Responsibilities:**
  - Fast Session Caching: User permissions and tenant identification cached for 24h.
  - Sub-millisecond Dashboard Metrics: Total counts, financial totals, and daily attendance percentages.
  - Real-time Pub/Sub: Instant notification broadcasts and live attendance update events.
  - Graceful Fallback: Built-in memory fallback ensures zero downtime even if Redis is temporarily offline.

---

## 3. Desktop Installer Roadmap (.exe, .msi, Ubuntu)

The backend and frontend are architected to be completely self-contained and ready for packaging:
1. **Frontend Packaging:** Next.js configured with standalone output (`output: "standalone"`).
2. **Backend Packaging:** NestJS compiled into a single executable binary via `pkg` or launched via a bundled Node.js runtime.
3. **Database Packaging:**
   - **Local Server Setup:** Automate PostgreSQL + MongoDB + Redis services via background Windows Services / Linux systemd services.
4. **Installer Bundlers:**
   - **Windows:** Inno Setup or WiX Toolset for `.exe` and `.msi` installers.
   - **Ubuntu:** `.deb` package with systemd service definitions.
