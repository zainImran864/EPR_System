# Module 06: Attendance Tracking & QR Verification

## 1. Overview
The **Attendance Tracking System** supports daily student roll call, teacher clock-in/out, automated percentage calculations, leave application workflows, and instant parent notifications for unexcused absences.

---

## 2. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **Attendance Dashboard** | [`apps/school-erp/app/(dashboard)/attendance/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/\(dashboard\)/attendance/page.tsx) |
| **QR Code Scanner / Marker** | [`apps/school-erp/app/components/attendance/QRScannerModal.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/attendance/QRScannerModal.tsx) |
| **Class Attendance Sheet** | [`apps/school-erp/app/components/attendance/AttendanceGrid.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/attendance/AttendanceGrid.tsx) |
| **Client Hook** | [`apps/school-erp/app/hooks/useAttendance.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/hooks/useAttendance.ts) |
| **REST API Connector** | [`apps/school-erp/app/api/client.ts` -> `attendanceRestApi`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/api/client.ts) |

### Backend Layer
| Purpose | File Path |
| :--- | :--- |
| **Controller** | [`apps/school-erp-backend/src/modules/attendance/attendance.controller.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/attendance/attendance.controller.ts) |
| **Service** | [`apps/school-erp-backend/src/modules/attendance/attendance.service.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/attendance/attendance.service.ts) |
| **DTOs** | [`apps/school-erp-backend/src/modules/attendance/dto/record-attendance.dto.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/attendance/dto/record-attendance.dto.ts) |
| **Module Definition** | [`apps/school-erp-backend/src/modules/attendance/attendance.module.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/attendance/attendance.module.ts) |

---

## 3. Database Models & Storage

### PostgreSQL (`AttendanceRecord`)
- `id`: UUID (Primary Key)
- `schoolId`, `studentId`, `classId`, `sectionId`
- `date`: `DateTime` (Indexed per date + student for fast daily queries)
- `status`: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`
- `remarks`: Optional note (e.g., medical slip reference)

### MongoDB
- **`Notification`**: Dispatches alert to linked parents when student status is marked `ABSENT`.

### Redis
- Daily quick-stats cache: `attendance:{schoolId}:{date}` storing present count, absent count, and attendance percentage.

---

## 4. API Endpoints

| Method | Endpoint | Access Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/attendance` | `SUPER_ADMIN`, `ADMIN`, `TEACHER` | Query attendance records by date, class, and section |
| `POST` | `/api/attendance/bulk` | `SUPER_ADMIN`, `ADMIN`, `TEACHER` | Submit bulk attendance array for an entire class section |
| `GET` | `/api/attendance/student/:studentId` | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `PARENT` | Retrieve attendance history and overall percentage for a student |
| `GET` | `/api/attendance/summary` | `SUPER_ADMIN`, `ADMIN` | Monthly and term attendance percentage breakdown |
