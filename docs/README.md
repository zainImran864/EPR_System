# AcademiX Multi-Tenant School ERP — Technical Documentation

Welcome to the comprehensive technical documentation for **AcademiX (School ERP SaaS)**. This directory contains end-to-end specifications for every feature and module from backend database models and REST endpoints to frontend pages, React hooks, and Zustand client stores.

---

## 📚 Documentation Index

| Document | Topic & Scope |
| :--- | :--- |
| [**System Architecture**](./ARCHITECTURE.md) | High-level system design, Tri-Database tier (PostgreSQL, MongoDB, Redis), NestJS modular backend, Next.js frontend, and Desktop packaging roadmap (.exe, .msi, Ubuntu). |
| [**Environment & Local Setup**](./ENVIRONMENT_AND_SETUP.md) | Single root `.env` configuration, Docker Compose database setup, Prisma migrations, and database seeding. |
| [**01. Auth & Security Module**](./modules/01_AUTH_AND_SECURITY.md) | Multi-tenant auth, JWT tokens, 2FA (TOTP), Role-Based Access Control (RBAC), password management, and user themes. |
| [**02. Schools & Tenancy Module**](./modules/02_SCHOOLS_AND_TENANCY.md) | Multi-tenancy isolation, branding, SMTP configuration, and SuperAdmin school registration approval queue. |
| [**03. Classes, Sections & Subjects Module**](./modules/03_CLASSES_SECTIONS_SUBJECTS.md) | Academic grade levels (1-12), sections with room/capacity limits, and subject management. |
| [**04. Faculty & Staff Module**](./modules/04_FACULTY_AND_STAFF.md) | Teacher directory, automatic `EMP-xxx` ID generation, user account provisioning, and qualifications. |
| [**05. Students & Parents Module**](./modules/05_STUDENTS_AND_PARENTS.md) | Student directory, automatic `ADM-YYYY-xxx` numbering, linked parent accounts, and emergency contacts. |
| [**06. Attendance System Module**](./modules/06_ATTENDANCE_SYSTEM.md) | Daily & period attendance, bulk marking grid, monthly statistics, and Redis real-time sync. |
| [**07. Exams, Marks & Report Cards Module**](./modules/07_EXAMS_MARKS_REPORT_CARDS.md) | Exam terms, marks entry matrix, automatic letter grade calculations (`A+` to `F`), and printable report cards. |
| [**08. Fees & Challans Module**](./modules/08_FEES_AND_CHALLANS.md) | Monthly/term fee structures, bulk challan generation, printable 3-copy fee challans, and payment reconciliation. |
| [**09. Timetable & Scheduling Module**](./modules/09_TIMETABLE_AND_SCHEDULING.md) | 8-period weekly schedule builder, teacher conflict detection, and room collision prevention. |
| [**10. Notifications & Audit Logs Module**](./modules/10_NOTIFICATIONS_AND_AUDIT.md) | MongoDB-backed notification engine, targeted/broadcast messaging, and security audit log trail. |
| [**11. Dashboards & Analytics Module**](./modules/11_DASHBOARDS_AND_ANALYTICS.md) | Role-tailored dashboards (SuperAdmin, Admin, Teacher, Student, Parent) with Redis sub-millisecond cache. |

---

## 🎯 System Quick Reference

- **Backend Location:** [`apps/school-erp-backend/`](../apps/school-erp-backend)
- **Frontend Location:** [`apps/school-erp/`](../apps/school-erp)
- **Central Environment File:** [`.env`](../.env) (symlinked to both apps)
- **Database Orchestration:** [`docker-compose.yml`](../docker-compose.yml) (PostgreSQL 16, MongoDB 7, Redis 7)
- **PostgreSQL Schema:** [`apps/school-erp-backend/prisma/schema.prisma`](../apps/school-erp-backend/prisma/schema.prisma)
- **API Client:** [`apps/school-erp/app/api/client.ts`](../apps/school-erp/app/api/client.ts)
