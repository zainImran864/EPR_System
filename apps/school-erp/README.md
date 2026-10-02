# AcademiX — Multi‑Tenant School ERP

AcademiX is a complete, production‑style **School Management SaaS**. A school registers itself, a platform **super‑admin** approves it, and the approved **school‑admin** then runs the whole institution from one dashboard — provisioning teachers, students and parents, building timetables, taking attendance, entering marks, generating report cards, and billing fees. Each role (super‑admin, admin, teacher, student, parent) gets its own tailored portal, and every school's data is fully isolated from every other school (**multi‑tenant**).

Everything is reactive: data flows from the Convex database straight to the UI, so when a teacher uploads attendance or a marks sheet, the admin, student and parent screens update **live** with no refresh.

---

## Table of contents

1. [What the project does](#1-what-the-project-does)
2. [Tech stack & languages](#2-tech-stack--languages)
3. [Packages — what & why](#3-packages--what--why)
4. [Why Convex for the database](#4-why-convex-for-the-database)
5. [Architecture & data flow](#5-architecture--data-flow)
6. [Folder structure (detailed)](#6-folder-structure-detailed)
7. [Convex backend files (detailed)](#7-convex-backend-files-detailed)
8. [Routes & features (every page)](#8-routes--features-every-page)
9. [Cross‑cutting features](#9-cross-cutting-features)
10. [Getting started](#10-getting-started)
11. [Environment variables](#11-environment-variables)
12. [What this project is about](#12-what-this-project-is-about)

---

## 1. What the project does

| Role | What they can do |
|------|------------------|
| **Super Admin** (platform) | Approve/reject school registrations, approve school **name‑change** requests, view platform stats. Has no school of their own. |
| **School Admin** | Manage students, classes & sections, faculty/staff, timetable, attendance, marks & results (with report cards), fees & challans, notifications, school branding + SMTP, and personal settings. |
| **Teacher** | Their timetable, upload marks, mark attendance, personal settings. |
| **Student** | Their results (+ report card PDF), attendance, timetable, fees (+ challan), settings. |
| **Parent** | Their child's results, attendance, timetable, fees, settings. |

**Signature flows**

- **Self‑registration → approval:** a school registers → lands on an "under review" page → super‑admin approves → the admin account activates and the school's grade‑classes are created automatically. Formatted branded emails are sent at register / approve / decline.
- **Account provisioning:** adding a teacher or student auto‑generates a **unique per‑school login email** (`nameT@school.com`, `nameS@school.com`, `nameP@school.com`) and, for students, both a student and a linked parent account sharing one admin‑set password. Credentials are emailed to the real inbox via the school's own SMTP.
- **Auto identifiers:** Employee IDs (`EMP‑001`) and admission numbers (`ADM‑2026‑001`) are generated server‑side and shown read‑only in the forms.
- **2FA:** TOTP (Google Authenticator) with QR enrollment, a login code challenge, and remembered trusted devices.
- **Documents:** report cards and fee challans render as branded, print‑to‑PDF pages (school logo top, AcademiX footer). Rosters export to branded **Excel**.
- **PWA:** installable with an offline fallback.

---

## 2. Tech stack & languages

| Layer | Technology | Language |
|-------|-----------|----------|
| Frontend framework | **Next.js 16** (App Router, Turbopack) | **TypeScript / TSX** |
| UI | **React 19** + **Tailwind CSS v4** | TSX + CSS |
| Backend / database | **Convex** (serverless functions + reactive DB) | TypeScript |
| Client state | **Zustand** | TypeScript |
| Charts | **Recharts** | TSX |
| Styling utility | CSS variables + Tailwind | CSS |

- **TypeScript everywhere** — one language across the UI, hooks, state and the database functions. Convex generates types from the schema, so the same `Id<"students">` type flows end‑to‑end.
- **Next.js App Router** — file‑system routing: every folder under `app/` with a `page.tsx` is a route; a `layout.tsx` wraps its subtree. Rendering here is **client‑side (CSR)** because the data source (Convex) is realtime and per‑user; gating is done client‑side via `RoleGate` (no middleware needed).
- **Tailwind v4** — utility classes + a small set of design tokens (brand teal, the runtime `--sidebar-accent` variable for per‑user theming) in `app/globals.css`.

---

## 3. Packages — what & why

**Runtime dependencies**

| Package | Why it's used |
|---------|---------------|
| `next` | App framework, routing, build, image/font optimization. |
| `react`, `react-dom` | UI library. |
| `convex` | Reactive database + serverless backend functions + generated types. The client (`convex/react`) gives `useQuery`/`useMutation`/`useAction` hooks that re‑render on data change. |
| `zustand` | Lightweight client state (auth token, UI filters, sidebar open/closed, toasts) without boilerplate or context hell. |
| `recharts` | Dashboard charts (bar/line/area/donut) wrapped into reusable branded components. |
| `lucide-react` | Icon set used across the whole UI. |
| `clsx` + `tailwind-merge` | `cn()` helper — conditionally join and de‑dupe Tailwind classes. |
| `nodemailer` | Sends SMTP email from Convex Node actions (register/approve/decline + credential + test emails). |
| `qrcode` | Renders the TOTP `otpauth://` URI into a scannable QR image for 2FA enrollment. |
| `exceljs` | Generates the **branded `.xlsx` exports** (school banner, styled table, AcademiX footer) fully client‑side. |
| `puppeteer` | Available for headless PDF generation; the shipped report card / challan flow uses the browser's native print‑to‑PDF for reliability, with puppeteer kept for future server‑side rendering. |
| `crypto` | Present as a dependency; hashing/TOTP actually use the runtime **Web Crypto** (`crypto.subtle`) available in Convex. |

**Dev dependencies:** `typescript`, `tailwindcss` + `@tailwindcss/postcss`, `eslint` + `eslint-config-next`, `vitest` + `convex-test` + `@edge-runtime/vm` (unit tests), `@playwright/test` (e2e), and `@types/*`.

---

## 4. Why Convex for the database

Convex is a **reactive, TypeScript‑native backend** — the database, the server functions, and the realtime layer in one. It's a strong fit here because:

1. **Realtime by default.** `useQuery` subscribes; when a teacher writes attendance or marks, every admin/student/parent view showing that data updates instantly — no polling, no manual refetch, no websockets to wire up.
2. **End‑to‑end types.** The schema in `convex/schema.ts` generates types (`Id<"students">`, doc shapes) consumed directly in the React hooks, so a wrong field is a compile error.
3. **Serverless functions colocated with data.** Queries, mutations and Node "actions" (for `nodemailer`) live in `convex/*.ts` and are deployed together. Mutations are transactional.
4. **Multi‑tenant scoping is simple.** Every table is indexed by `schoolId`; queries filter on the logged‑in user's school, keeping each tenant's data isolated.
5. **Built‑ins we use:** file storage (avatars, school logos), scheduler (`ctx.scheduler.runAfter` to send emails after a mutation), and Web Crypto for password hashing (PBKDF2) and TOTP.

Auth is **custom / database‑backed** (our own `users` + `sessions` tables, PBKDF2 hashing, tokens in `localStorage`) rather than Clerk/Convex‑Auth, because the product needs school‑scoped, admin‑provisioned accounts with `pending / active / inactive` statuses and synthetic per‑school emails.

---

## 5. Architecture & data flow

The app follows a consistent **`api → hooks → store → page/module`** pattern:

```
Convex function (convex/*.ts)          ← queries / mutations / actions + schema
        │  api.<module>.<fn> reference
app/api/*.ts                           ← thin adapters exposing those refs
        │
app/hooks/use*.ts                      ← useQuery/useMutation wrappers, scoped to the active school
        │            ▲
app/store/*.ts (Zustand)               ← UI state: auth token, filters, pagination, toasts
        │
modules/**/*.tsx  &  app/**/page.tsx   ← feature UIs and route pages
        │
components/**                          ← reusable UI, layout, charts, print, brand
```

- **Multi‑tenant scoping:** `useActiveSchool` resolves the **logged‑in user's** `schoolId` (not "the first school"), and every data hook passes that id, so each portal shows only its own school.
- **Auth session:** `useAuth` reads the token from `useAuthStore` (localStorage) and resolves `currentUser`; `RoleGate` redirects unauthenticated users to `/login` and wrong‑role users to their own dashboard.

---

## 6. Folder structure (detailed)

```
apps/school-erp/
├── app/                     # Next.js App Router — routes, providers, client layers
│   ├── layout.tsx           # Root layout: fonts, ConvexClientProvider, Toaster, PWA + Theme boot
│   ├── page.tsx             # Root gate → redirects to the role's home (or /login)
│   ├── globals.css          # Tailwind + design tokens + --sidebar-accent variable
│   ├── manifest.ts          # PWA web manifest (name, theme, icons)
│   ├── icon.svg             # App icon (also public/icon.svg + public/icon-maskable.svg)
│   ├── ConvexClientProvider.tsx  # Wraps the app in the Convex React client
│   │
│   ├── login/ register/ pending/ offline/   # Public pages
│   ├── superadmin/dashboard/                # Platform console
│   ├── admin/    …                          # School‑admin portal (layout + pages)
│   ├── teacher/  …                          # Teacher portal
│   ├── student/  …                          # Student portal
│   ├── parent/   …                          # Parent portal
│   ├── print/                               # Printable docs (report‑card, fee‑challan)
│   │
│   ├── api/                 # Endpoint adapters: re‑export Convex api.* refs per domain
│   ├── hooks/               # React data hooks (one per domain) + useAuth/useToast/etc.
│   ├── store/               # Zustand stores (auth token, UI state, toasts)
│   ├── lib/                 # Client utilities (see below)
│   └── types/               # Shared TS types (e.g. student.ts, common.ts)
│
├── convex/                  # Backend: schema + serverless functions
│   ├── schema.ts            # All tables + indexes (source of truth for types)
│   ├── auth.ts account.ts   # Auth, sessions, 2FA, per‑user settings
│   ├── schools.ts registrations.ts superadmin.ts
│   ├── students.ts teachers.ts classes.ts
│   ├── attendance.ts marks.ts results.ts exams
│   ├── timetable.ts fees.ts notifications.ts
│   ├── email.ts             # "use node" actions — nodemailer + HTML templates
│   ├── dashboard.ts seed.ts demo.ts
│   ├── lib/                 # hash.ts (PBKDF2), identity.ts (emails), totp.ts (2FA)
│   └── _generated/          # Convex‑generated types & api proxy (do not edit)
│
├── modules/                 # Feature UIs (composed by the route pages)
│   ├── students/ staff/ classes/ dashboard/
│   ├── attendance/ marks/ results/ timetable/ fees/
│   ├── notifications/ settings/
│
├── components/              # Reusable presentation layer
│   ├── ui/                  # Design system: Button, Input, Card, DataGrid, Modal, Switch…
│   ├── layout/              # AppShell, AppSidebar, Topbar, NotificationBell, navConfig…
│   ├── charts/              # Recharts wrappers (Bar/Line/Area/Donut) + theme
│   ├── auth/                # RoleGate, AuthShell
│   ├── brand/               # AcademiXLogo / mark
│   ├── print/               # PrintDocument, FeeChallanSheet
│   ├── theme/               # ThemeSync (applies the user's sidebar colour)
│   └── pwa/                 # PWARegister (service‑worker registration)
│
├── public/                  # sw.js (service worker), icons, static assets
├── next.config.ts           # Next config
├── tailwind / postcss / tsconfig / eslint configs
└── package.json
```

### `app/api/*` — endpoint adapters
Each file is a thin object mapping friendly names to Convex refs, e.g. `studentsApi.create = api.students.createStudent`. Keeps the hooks decoupled from Convex paths.

### `app/hooks/*` — data hooks (one per domain)
`useAuth`, `useActiveSchool`, `useStudents`, `useTeachers`, `useClasses`, `useAttendance`, `useStudentAttendance`, `useMarks`, `useResults`, `useTimetable`, `useFees`, `useNotifications`, `useRegistrations`, `useAccount`, `useDashboard`, `useToast`, `useDebounce`. Each wraps `useQuery`/`useMutation`, scopes by the active school, and returns view‑ready data + actions.

### `app/store/*` — Zustand
`useAuthStore` (token + hydrate/clear from localStorage), `useAppStore` (active `schoolId`, sidebar open), `useStudentStore` / `useMarksStore` / `useAttendanceStore` / `useClassesStore` (filters + pagination), `useToastStore` (toast queue).

### `app/lib/*` — client utilities
- `utils.ts` — `cn()` class merger.
- `formatters.ts` — date/number/label formatting.
- `emailPreview.ts` — client mirror of the email generator (live previews in add forms).
- `device.ts` — trusted‑device token in localStorage + a human browser label.
- `theme.ts` — theme options, `applyThemeColor`, and the boot script for instant colour.
- `exportExcel.ts` — the branded `.xlsx` generator (exceljs).

---

## 7. Convex backend files (detailed)

| File | Contains |
|------|----------|
| `schema.ts` | All tables + indexes: `schools`, `users`, `sessions`, `trustedDevices`, `registrationRequests`, `schoolChangeRequests`, `classes`, `sections`, `subjects`, `classSubjects`, `teachers`, `students`, `attendance`, `exams`, `marks`, `timetableSlots`, `feeBills`, `notifications`, `notificationReads`. |
| `auth.ts` | `register`, `login` (password + trusted‑device + 2FA challenge), `logout`, `currentUser` (session → sanitized user + school + student context + settings), `verifyLoginTwoFactor`. |
| `account.ts` | `updateProfile`, `changePassword`, `setNotifications`, `setThemeColor`, avatar + school‑logo upload (Convex storage), `requestSchoolNameChange`, and 2FA: `startTwoFactorSetup`, `confirmTwoFactor`, `disableTwoFactor`, trusted‑device list/delete. |
| `schools.ts` | `getActiveSchool`, `getSchool` (SMTP secret stripped), `updateBranding`, `updateSmtp`, internal full‑doc query for email. |
| `registrations.ts` | Super‑admin queue: list requests, `approveRequest` (creates school + grade classes + activates admin + emails), `rejectRequest`, and school **name‑change** request list/resolve. |
| `superadmin.ts` | Seed the super‑admin + platform stats. |
| `students.ts` | List/create/update students; auto admission number; provisions student + linked parent logins; emails credentials. |
| `teachers.ts` | List/create teachers; auto employee id; provisions teacher login + emails credentials; status sync. |
| `classes.ts` | Classes + sections with de‑duped section names, student counts. |
| `attendance.ts` | Section roster, save attendance, per‑day summary, and **per‑student** record + rate. |
| `marks.ts` / `results.ts` | Marks entry; results aggregation per exam (totals, %, grade) and the report‑card payload. |
| `timetable.ts` | Section timetable, teacher timetable, upsert/delete slot. |
| `fees.ts` | Generate bills for a whole class/section, list, record payment, single + bulk challan payloads. |
| `notifications.ts` | Role‑targeted feed, unread count, broadcast, mark‑read (per‑user receipts). |
| `email.ts` | `"use node"` actions: per‑school SMTP transport (falls back to platform), branded HTML templates for register/approve/decline + separate student/parent/teacher credential emails + SMTP test. |
| `dashboard.ts` | Aggregated admin dashboard stats. |
| `seed.ts` / `demo.ts` | Demo data seeders (a full test school with timetable, marks and fees). |
| `lib/hash.ts` | PBKDF2‑SHA256 hashing + salt + token generation (Web Crypto). |
| `lib/identity.ts` | `slugify` + `buildEmail` (per‑school synthetic emails by role). |
| `lib/totp.ts` | RFC‑6238 TOTP (base32 + HMAC‑SHA1) — Google‑Authenticator compatible. |

---

## 8. Routes & features (every page)

**Public**

| Route | Purpose |
|-------|---------|
| `/login` | Sign in; shows the **2FA code step** when required (with "remember this device"). |
| `/register` | School self‑registration (classes offered, admin name, live email preview). |
| `/pending` | "Under review" screen after registering. |
| `/offline` | PWA offline fallback. |
| `/` | Gate — redirects to the role's home or `/login`. |

**Super Admin** — `/superadmin/dashboard`: registration approval queue + platform stats + school name‑change requests.

**Admin** (`app/admin/layout.tsx` = `RoleGate["admin"]` + `AppShell`)

| Route | Module | Feature |
|-------|--------|---------|
| `/admin/dashboard` | DashboardOverview | KPIs, charts, quick actions |
| `/admin/students` | StudentDirectory | Roster, add student (auto admission + student/parent logins), Excel export |
| `/admin/classes` | ClassManager | Classes & sections, subjects, class teacher |
| `/admin/teachers` | StaffDirectory | Faculty, add teacher (auto employee id + login), Excel export |
| `/admin/timetable` | TimetableBuilder | Per‑section day×period grid editor |
| `/admin/attendance` | AttendanceSheet | Section attendance |
| `/admin/marks` | MarkEntryGrid + AdminResults | Marks entry + results explorer + report cards |
| `/admin/fees` | FeeManager | Generate bills for a class/section, record payments, print challans |
| `/admin/notifications` | BroadcastCenter | Role‑targeted announcements |
| `/admin/settings` | SchoolSettings + SmtpSettings + AccountSettings | Branding, logo, name‑change request, per‑school SMTP + test, personal account |

**Teacher** — `/teacher/{dashboard, marks, attendance, timetable, settings}`
**Student** — `/student/{dashboard, results, attendance, timetable, fees, settings}`
**Parent** — `/parent/{dashboard, results, attendance, timetable, fees, settings}`

**Print** — `/print/report-card?student=&exam=` and `/print/fee-challan?bill=` (single) or `?section=&class=` (bulk) → branded, print‑to‑PDF sheets.

---

## 9. Cross‑cutting features

- **Custom DB auth** — PBKDF2 hashing, session tokens, `pending/active/inactive` statuses, role routing via `RoleGate`.
- **2FA (TOTP)** — QR enrollment, code‑verified enable/disable, login challenge, remembered **trusted devices** (removable in settings).
- **Per‑school SMTP** — schools send their own credential/test emails; separate branded templates for student/parent/teacher/test; platform SMTP fallback.
- **Auto identity** — per‑school unique emails + auto Employee ID / Admission Number.
- **Realtime notifications** — bell panel with unread badge + reactive toast on arrival.
- **Documents** — printable report cards & fee challans (school logo top, AcademiX bottom); branded Excel exports.
- **Per‑user sidebar theme** — saved in the DB, applied **instantly** before first paint (cached in localStorage + `--sidebar-accent` CSS var), reconciled with the DB on login.
- **PWA** — installable (`manifest.ts` + `public/sw.js` + `PWARegister`), offline page.
- **Reusable design system** — `components/ui/*` (Button, Input, Select, Card, DataGrid, Modal, Switch, Badge, Avatar, Skeleton, Pagination…) and chart wrappers.

---

## 10. Getting started

```bash
cd apps/school-erp
npm install

# 1) Deploy Convex functions + generate types (also starts the dev backend)
npx convex dev            # or: npx convex dev --once

# 2) Seed the platform super‑admin (documented creds)
npm run seed:superadmin

# 3) (optional) Seed a full demo school with timetable/marks/fees
npx convex run demo:seedScenario

# 4) Run the app
npm run dev               # http://localhost:3000
```

Build for production: `npm run build`. Deploys cleanly to **Vercel** (set `NEXT_PUBLIC_CONVEX_URL`; SMTP/TOTP env live on Convex).

**Demo logins** (after `demo:seedScenario`): super‑admin `admin321@erp.com / Test-123`, admin `saraadmin@oakridge.com / Admin-123`, teacher `aliT@oakridge.com / Teacher-123`, student `zaraS@oakridge.com / Student-123`, parent `zaraP@oakridge.com / Student-123`.

---

## 11. Environment variables

**Next.js (Vercel):**
- `NEXT_PUBLIC_CONVEX_URL` — the Convex deployment URL (the only runtime var the frontend needs).

**Convex (`npx convex env set …`):**
- `SMTPMAIL`, `SMTPPASS` — platform email fallback (Gmail app password).
- `TOTP_ISSUER` — label shown in authenticator apps (default `AcademiX`).
- `SITE_URL` — the deployed app URL (for links).

Per‑school SMTP (host/port/user/pass/from) is stored per tenant in the `schools` table via the admin SMTP settings, not in env.

---

## 12. What this project is about

AcademiX is a demonstration of a **real, end‑to‑end multi‑tenant SaaS** built on a modern reactive stack. It shows how far you can get with **Next.js + Convex + TypeScript**: a fully role‑gated product where schools onboard themselves, admins provision their whole institution, and every actor — teacher, student, parent — sees exactly and only their own live data. It covers the hard, unglamorous parts of school software that make or break adoption: identity & provisioning, second‑factor security, tenant isolation, transactional email, printable official documents, spreadsheet exports, notifications, and per‑user personalization — all wired so the interface updates the instant the underlying data changes.

> Built with **AcademiX** — School Management Platform.
