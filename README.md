# AcademiX — Multi-Tenant School ERP SaaS Platform

Enterprise-grade, multi-tenant School ERP platform built with **Next.js 16**, **NestJS 11**, **Prisma 7**, **PostgreSQL 16 (Primary + Read-Replica Load Balancer)**, **MongoDB 7**, and **Redis 7**.

Designed for private schools and academic institutions with dynamic per-school branding, a **Teal (`#0D9488`) + Deep Slate (`#0F172A`) Design System 2.0**, role-based portals for **5 roles**, print-ready academic documents (Fee Challans, Report Cards, Roll No Slips, Question Papers, Timetables), and WhatsApp/Email notification dispatch.

---

## ✨ Key Highlights & Architecture

### 1. Design System 2.0 & Next-Level UI/UX
- **Canonical Palette**: Teal (`#0D9488`) primary brand accent paired with Deep Slate (`#0F172A` sidebar, `#F8FAFC` app canvas) and semantic status tokens (`Emerald`, `Amber`, `Rose`, `Sky`).
- **Dynamic Per-School & Per-User Theme Engine**: 8 full `50–900` CSS variable shade ramps (`Teal`, `Royal Blue`, `Indigo`, `Emerald`, `Crimson`, `Violet`, `Amber`, `Slate`) applied before first paint via `THEME_BOOT_SCRIPT`.
- **Global Command Palette (`⌘K` / `Ctrl+K`)**: Instant keyboard-driven navigation across all ERP modules plus a built-in Quick Theme Switcher in the Topbar.
- **Enhanced Authentication Flow**:
  - **Login (`/login`)**: Interactive 1-click Demo Role Cards with role badges, Password Visibility Toggle, Two-Factor Authentication (2FA) challenge support, and an **Animated Login-to-Dashboard Transition Screen**.
  - **School Registration (`/register`)**: Interactive Grade Preset Selector, **4-Segment Password Strength Meter**, and auto-generated Admin Email preview with 1-click Copy.

### 2. High-Concurrency Database Read-Replica & Round-Robin Load Balancer
- **Primary Write Pool + Read-Replica Pool**: Implemented in `PrismaService` (`apps/school-erp-backend/src/database/prisma.service.ts`) using `@prisma/adapter-pg` and `pg.Pool`.
- **Automatic Read Distribution**: Heavy analytical, directory, and reporting queries route through `this.prisma.read` (`getReadClient()`), which distributes read traffic across configured `DATABASE_READ_REPLICA_URLS` using **Round-Robin Load Balancing** with automatic fallback to the primary pool.
- **Live Health Telemetry**: `GET /api/health` exposes real-time connection pool metrics (`totalCount`, `idleCount`, `waitingCount`) and load balancer strategy status.

### 3. Query Optimization & Low-Memory Cache Tuning
- **Composite B-Tree Indexes**: Indexed high-cardinality multi-tenant filters in `prisma/schema.prisma`:
  - `Student`: `(schoolId, status)`, `(schoolId, classId, sectionId)`
  - `Attendance`: `(schoolId, date)`, `(sectionId, date)`
  - `Mark`: `(schoolId, examTermId, subjectId)`
  - `FeeChallan`: `(schoolId, status)`, `(studentId, status)`
- **Native SQL Aggregations**: `DashboardService.getAdminStats` uses native PostgreSQL `groupBy` and `aggregate` queries instead of in-memory array scans.
- **Low Cache Footprint & Low TTL**:
  - PostgreSQL tuned in `docker-compose.yml` for a lean memory footprint (`shared_buffers=64MB`, `work_mem=4MB`, `effective_cache_size=192MB`, `max_connections=200`, `idleTimeoutMillis=8000–10000ms`).
  - Redis configured with `128MB` cap (`allkeys-lru`) and **ultra-low cache TTL (`5s` for dashboard stats, `10s` for school lookups)** so data is always fresh without bloating cache memory.

### 4. Teacher Daily Self-Attendance (Live GPS Geofence + Mobile QR Companion + Photo Proof + 3-Day Image Auto-Cleanup) & Leave Approvals
- **School Campus Live Map & Geofence (`/admin/teacher-attendance`)**: School Admins configure the school's exact GPS coordinates (`latitude`, `longitude`) and allowed campus radius (`geofenceRadiusMeters`, default `250m`). All teachers' daily check-ins match against that location.
- **Mobile QR Code Live GPS Companion (`/mobile-gps/[sessionId]`)**: Because laptop Wi-Fi geolocation can be inaccurate, Desktop/Laptop users (`!isMobileDevice` / `hidden md:flex`) see a scannable **Mobile QR Code** on both the Teacher Check-In page (`/teacher/my-attendance`) and the Admin Campus Location page (`/admin/teacher-attendance`). Scanning the QR code on a phone opens `/mobile-gps/[sessionId]` (no separate login required), captures the phone's hardware GPS + live camera selfie, automatically marks the teacher `PRESENT` (or saves the school location for Admin), and syncs live back to the laptop screen via polling.
- **Automatic Mobile Device Detection**: When a Teacher or Admin is **already on a mobile phone**, the QR code is automatically hidden (`!isMobileDevice` + `hidden md:flex`) so they directly see and mark teacher attendance or set the school campus location on their device.
- **Mobile-Responsive Student Attendance & Marks Upload**: Both Admin and Teacher can mark student attendance (`/admin/attendance`, `/teacher/attendance`) and enter/upload student examination marks (`/admin/marks`, `/teacher/marks`) on mobile devices using dedicated touch-friendly **Mobile Card Layouts (`md:hidden`)** with sticky save bars alongside the desktop tables (`hidden md:block`).
- **Automatic `PRESENT` Marking on Location Match (`/teacher/my-attendance`)**: When a teacher uploads/captures a live campus photo and their live GPS coordinates match within the school's configured geofence radius (`distanceMeters <= geofenceRadiusMeters`), the teacher is **automatically marked `PRESENT`**.
- **Haversine Distance Verification**: Both frontend and backend (`POST /api/attendance/teacher/check-in`) verify the exact distance in meters from the school campus. If the teacher is outside the school geofence radius, check-in is rejected with a clear location mismatch error showing the exact distance in meters.
- **Automatic 3-Day Image Retention Policy**: Attendance photos older than **3 days** (`PHOTO_RETENTION_DAYS = 3`) are automatically deleted (`photoUrl = null`) on startup, during check-in/record queries, or via `POST /api/attendance/teacher/purge-old-photos` so the database never gets crowded with images, while preserving the verified `PRESENT` status and GPS distance metadata.
- **Teacher Leave Application & Principal Approval**: Teachers apply for leave (`CASUAL`, `SICK`, `EMERGENCY`, `OFFICIAL`, `OTHER`) on `/teacher/my-attendance`, and School Admins review and **Approve / Reject** leave requests on `/admin/teacher-attendance`.

### 5. Fee Due-Date Late Increment Policy, Overdue Notifications & White-Label Single-Page Print Reports
- **Configurable Late Fee Increment After Due Date (`/admin/fees`)**: School Admins can configure the school's **Late Fee Increment Policy** (`GET/PATCH /api/fees/late-fee-policy`) or set a custom late fee increment when generating fee bills.
- **Automatic Overdue Detection & Dual Notifications**: When a fee challan's due date passes (`dueDate < today`) and remains unpaid, the late fee increment is automatically applied (`status: OVERDUE`), and real-time notifications are dispatched to both the **School Admin** (listing the overdue students) and the **Parent / Student** (`NotificationsService` + in-page alert banners on `/admin/fees`, `/parent/fees`, and `/student/fees`).
- **Written on Fee Cards & Printable Challans**: Every Fee Card (`/parent/fees`, `/student/fees`, `/admin/fees`) and printable Fee Challan (`/print/fee-challan`) explicitly displays `Within Due Date`, `Late Fee Increment (After Due Date): +X`, and `Payable After Due Date`.
- **Single-Page White-Label Print Reports (`/print/*`)**:
  - **Timetable Print (`/print/timetable`)**: Compacted A4 landscape layout (`max-height: 198mm`, `break-inside: avoid`) so both Teacher and Class timetables — including the 3 verification signature blocks — fit cleanly on **1 single page** without spilling signatures onto a second page.
  - **Zero URL Clutter & White-Label School Branding**: Uses `@page { margin: 0mm !important; }` and dynamic `document.title` set to the school's own name so browser print headers/footers never print `localhost:3000/print/...` URLs, and all print reports (`timetable`, `fee-challan`, `report-card`, `roll-no-slip`, `question-paper`, `financial-report`, `expense-comparison`) display **only the school's own branding** (zero third-party watermarks).

### 6. Finance & Accounts (Operating Expenses, MoM Comparison, Positive Inputs & Global Multi-Currency)
- **Manage & Track Expenses (`/admin/expenses`, `/admin/expenses/track`)**: School Admins record monthly school operating expenditures (utilities, teacher/staff payroll, stationary, maintenance) and visualize net profit/loss alongside collected tuition fees across monthly, yearly, or custom date ranges.
- **Month-over-Month (MoM) Comparison**: Interactive percentage variance indicators comparing current expenditures directly against preceding months, with single-page printable comparison reports (`/print/expense-comparison`).
- **Strictly Positive Values**: All financial inputs for expenses, fee structures, and challans validate strictly positive numbers (`@Min(0.01)`).
- **Global Currency Configuration**: Admin selects school currency symbol (`$`, `Rs / PKR`, `€`, `£`, `₹`, etc.) from Settings, automatically reflected across ledgers, cards, and printouts.

### 7. Homework & Assignments Module (Hard Deadline Locking & Grading)
- **Teacher Assignment Creation (`/teacher/homework`)**: Teachers post homework with rich instructions, file attachments, points, and strict submission deadlines.
- **Student Submission & Hard Deadline Lock (`/student/homework`, `/parent/homework`)**: Students view details, download materials, and submit solutions. Submissions after deadline are automatically locked with `status: MISSED` and `0 marks`.
- **Teacher Review & Feedback**: Teachers evaluate submissions, enter marks obtained, and provide constructive guidance notes.

### 8. Parent-Teacher Collaboration, Student Leave & Multi-Child Switcher
- **Multi-Child Parent Switcher**: Parents with multiple enrolled children seamlessly switch active student context directly in the Topbar, dynamically filtering attendance, homework, report cards, fees, and honors.
- **Student Leave Requests**: Parents apply for student leave; teachers and admins approve/reject with instant attendance status synchronization to `LEAVE`.
- **Student Absence Alerts**: Immediate high-priority notifications dispatched to parents whenever their child is marked `ABSENT`.
- **Parent-Teacher Meetings (PTM) (`/teacher/ptm`, `/parent/ptm`, `/admin/ptm`)**: Schedule in-person or online video conferences with custom time slots and confirmation workflows.

### 9. Student Engagement & Gamified Achievement Stars
- **Automated Performance Badges**:
  - ⭐ **Weekly Attendance Star**: Awarded for 100% full-week attendance without absence.
  - 🏆 **Academic Excellence Star**: Awarded for maintaining an 80%+ cumulative exam average.
  - 🌟 **Homework Champion**: Awarded for timely submission of all coursework.
  - ⏱️ **Punctuality Master**: Awarded for 0 late arrivals.
- **Showcase View (`/student/achievements`, `/parent/achievements`)**: Visual trophy counter and progress trackers.

### 10. PWA Offline Student Attendance, School Hours Gate & Backups
- **Offline Attendance Queue**: Teachers can mark student roll call without internet connectivity; records queue locally and auto-sync when online.
- **Official School Hours Gate**: Teacher daily self-attendance is strictly restricted to admin-configured operating hours (e.g., `07:30` - `14:00`).
- **Database Backup Engine**: Automated nightly backups plus 1-click on-demand snapshots in `/admin/settings` written safely to `/backups`.
- **English & Urdu (اردو) Multi-Language Support**: Topbar language toggle switching between English (`ltr`) and Urdu (`rtl`) with per-user persistence.

---

## 👥 Multi-Role Portals & Demo Credentials

Seed the database via `POST /api/seed/demo` or click **"Seed Demo School & Accounts"** on the `/login` page:

| Role | Email | Password | Portal Home | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@academix.com` | `SuperAdmin@123` | `/superadmin/dashboard` | Approve/reject school registrations, platform-wide metrics & audit logs |
| **School Admin** | `admin@oakridge.edu` | `Admin@123` | `/admin/dashboard` | Full school management: Students, Teachers, Classes, Attendance, Exams, Fees, Timetable, Branding, WhatsApp |
| **Teacher** | `sarah@oakridge.edu` | `Teacher@123` | `/teacher/dashboard` | Mark section attendance, enter exam marks, build balanced question papers, view schedule |
| **Student** | `alice@oakridge.edu` | `Student@123` | `/student/dashboard` | View attendance summary, exam results/report card, fee challans, class timetable |
| **Parent** | `robert.parent@oakridge.edu` | `Parent@123` | `/parent/dashboard` | Track child attendance, academic report cards, fee ledgers, school broadcasts |

---

## 📂 Repository Structure

```text
.
├── .agents/skills/epr-design/     # Canonical Design System 2.0 tokens & reference UI kit
├── design-guidelines/             # Interactive HTML/CSS Design Guidelines & Component Spec
├── apps/
│   ├── school-erp/                # Next.js 16 App Router Frontend (51 role & print pages)
│   └── school-erp-backend/        # NestJS 11 REST API + Prisma 7 + Read-Replica Load Balancer
└── docker-compose.yml             # PostgreSQL 16 (Primary + Replica), MongoDB 7, Redis 7
```

---

## 🚀 Quick Start & Local Development

### 1. Start Infrastructure Containers (Docker)
```bash
sudo docker compose up -d
```
This starts:
- `academix_postgres` (`127.0.0.1:5432`) — Primary PostgreSQL 16 with low-cache memory tuning
- `academix_postgres_replica` (`127.0.0.1:5433`) — Read-Replica PostgreSQL 16 instance
- `academix_mongodb` (`127.0.0.1:27017`) — MongoDB 7 for Audit Logs & Notifications
- `academix_redis` (`127.0.0.1:6379`) — Redis 7 with 128MB LRU policy

### 2. Backend Setup (`apps/school-erp-backend`)
```bash
cd apps/school-erp-backend
npm install
npx prisma generate
npx prisma db push
PORT=3001 npm run start:dev
```

### 3. Frontend Setup (`apps/school-erp`)
```bash
cd apps/school-erp
npm install
npm run dev
```
Open `http://127.0.0.1:3000/login` in your browser.

---

## 🧪 Comprehensive Testing Suite

All layers of the application are covered by automated tests:

1. **Backend Unit Tests (Jest)**:
   ```bash
   cd apps/school-erp-backend
   npm test
   ```
2. **Backend Full 14-Module E2E Suite (Jest + Supertest + Live PostgreSQL/Redis)**:
   ```bash
   cd apps/school-erp-backend
   npm run test:e2e -- --forceExit
   ```
3. **Frontend Pages, Design Tokens & Live DB Integration Tests (Vitest)**:
   ```bash
   cd apps/school-erp
   npm test
   ```
4. **Full-Product Browser E2E Verification (Playwright)**:
   ```bash
   cd apps/school-erp
   npx playwright test tests/e2e-full-product.spec.ts
   ```
