# Module 11: Role-Based Dashboards & Analytics

## 1. Overview
The **Dashboards & Analytics Module** renders tailored metrics, KPI cards, financial graphs, attendance distributions, and urgent actions for each of the 5 system roles: Super Admin, School Admin, Teacher, Student, and Parent.

---

## 2. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **Main Dashboard Root** | [`apps/school-erp/app/(dashboard)/dashboard/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/\(dashboard\)/dashboard/page.tsx) |
| **Super Admin Platform Overview** | [`apps/school-erp/app/components/dashboard/SuperAdminDashboard.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/dashboard/SuperAdminDashboard.tsx) |
| **School Admin KPI Hub** | [`apps/school-erp/app/components/dashboard/AdminDashboard.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/dashboard/AdminDashboard.tsx) |
| **Teacher Class Central** | [`apps/school-erp/app/components/dashboard/TeacherDashboard.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/dashboard/TeacherDashboard.tsx) |
| **Student / Parent Portal** | [`apps/school-erp/app/components/dashboard/StudentDashboard.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/dashboard/StudentDashboard.tsx) |
| **REST API Connector** | [`apps/school-erp/app/api/client.ts` -> `dashboardRestApi`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/api/client.ts) |

### Backend Layer
| Purpose | File Path |
| :--- | :--- |
| **Controller** | [`apps/school-erp-backend/src/modules/dashboard/dashboard.controller.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/dashboard/dashboard.controller.ts) |
| **Service** | [`apps/school-erp-backend/src/modules/dashboard/dashboard.service.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/dashboard/dashboard.service.ts) |
| **Module Definition** | [`apps/school-erp-backend/src/modules/dashboard/dashboard.module.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/dashboard/dashboard.module.ts) |

---

## 3. Real-Time Aggregations & Caching

### Redis Dashboard Cache Keys
- `dashboard:stats:superadmin`: Aggregates active schools, total student population across platform, monthly subscription recurring revenue.
- `dashboard:stats:school:{schoolId}`: Aggregates student headcount, faculty count, daily attendance rate, fee collection percentage, and pending admissions.

Cached with a 120-second sliding expiration to guarantee sub-millisecond dashboard page-load times.

---

## 4. API Endpoints

| Method | Endpoint | Access Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | All Authenticated Users | Dynamically returns role-specific KPI stats based on JWT claims |
| `GET` | `/api/dashboard/trends` | `SUPER_ADMIN`, `ADMIN` | Returns 12-month historical trends (enrollment, fee collection, attendance) |
