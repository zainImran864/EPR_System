# Module 04: Faculty & Staff Management

## 1. Feature Description & Capabilities
- **Faculty Roster:** Complete teacher profiles with qualifications, designation, specializations, and joining dates.
- **Auto Employee ID:** Automatically generated sequential IDs (`EMP-001`, `EMP-002`, etc.) shown read-only on enrollment forms.
- **Automated Login Provisioning:** Enrolling a faculty member automatically provisions a `User` account with role `TEACHER` and default temporary credentials.
- **Faculty Timetable Allocations:** Direct linkage to scheduled class teaching assignments.

---

## 2. Backend Files & Implementation
- **Module:** [`apps/school-erp-backend/src/modules/teachers/teachers.module.ts`](../../apps/school-erp-backend/src/modules/teachers/teachers.module.ts)
- **Controller:** [`apps/school-erp-backend/src/modules/teachers/teachers.controller.ts`](../../apps/school-erp-backend/src/modules/teachers/teachers.controller.ts)
- **Service:** [`apps/school-erp-backend/src/modules/teachers/teachers.service.ts`](../../apps/school-erp-backend/src/modules/teachers/teachers.service.ts)
- **DTOs:** [`apps/school-erp-backend/src/modules/teachers/dto/teacher.dto.ts`](../../apps/school-erp-backend/src/modules/teachers/dto/teacher.dto.ts) (`CreateTeacherDto`, `UpdateTeacherDto`)
- **Database Model (Prisma):** `model Teacher`, `model User`

### Key Endpoints:
- `GET /api/teachers`: Search and list faculty members.
- `GET /api/teachers/:id`: Retrieve single teacher profile and schedule.
- `POST /api/teachers`: Enroll new faculty member and create user account.
- `PATCH /api/teachers/:id`: Update faculty details and qualifications.
- `DELETE /api/teachers/:id`: Delete faculty member and associated login.

---

## 3. Frontend Files & Implementation
- **API Client:** [`apps/school-erp/app/api/teachers.ts`](../../apps/school-erp/app/api/teachers.ts) (`teachersRestApi`)
- **Teacher Directory Page:** [`apps/school-erp/app/admin/teachers/page.tsx`](../../apps/school-erp/app/admin/teachers/page.tsx)
- **Teacher Table & Directory:** [`apps/school-erp/modules/staff/TeacherDirectory.tsx`](../../apps/school-erp/modules/staff/TeacherDirectory.tsx)
- **Add/Edit Teacher Modal:** [`apps/school-erp/modules/staff/AddTeacherModal.tsx`](../../apps/school-erp/modules/staff/AddTeacherModal.tsx), [`EditTeacherModal.tsx`](../../apps/school-erp/modules/staff/EditTeacherModal.tsx)
- **Delete Confirmation Modal:** [`apps/school-erp/modules/staff/DeleteTeacherModal.tsx`](../../apps/school-erp/modules/staff/DeleteTeacherModal.tsx)
- **Hooks:** [`apps/school-erp/app/hooks/useTeachers.ts`](../../apps/school-erp/app/hooks/useTeachers.ts)
