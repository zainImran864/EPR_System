# Module 05: Students & Parents / Admissions

## 1. Overview
The **Students & Parents Module** handles student lifecycle management, admissions, enrollments, roll numbers, guardian relationships, and emergency contact registries across academic years and sections.

---

## 2. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **Students Registry View** | [`apps/school-erp/app/(dashboard)/students/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/\(dashboard\)/students/page.tsx) |
| **Student Detail View** | [`apps/school-erp/app/(dashboard)/students/[id]/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/\(dashboard\)/students/\[id\]/page.tsx) |
| **New Admission Dialog** | [`apps/school-erp/app/components/students/StudentForm.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/students/StudentForm.tsx) |
| **Student ID Card Generator** | [`apps/school-erp/app/components/students/StudentCard.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/students/StudentCard.tsx) |
| **Client Hook** | [`apps/school-erp/app/hooks/useStudents.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/hooks/useStudents.ts) |
| **REST API Connector** | [`apps/school-erp/app/api/client.ts` -> `studentsRestApi`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/api/client.ts) |

### Backend Layer
| Purpose | File Path |
| :--- | :--- |
| **Controller** | [`apps/school-erp-backend/src/modules/students/students.controller.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/students/students.controller.ts) |
| **Service** | [`apps/school-erp-backend/src/modules/students/students.service.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/students/students.service.ts) |
| **DTOs** | [`apps/school-erp-backend/src/modules/students/dto/create-student.dto.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/students/dto/create-student.dto.ts) |
| **Module Definition** | [`apps/school-erp-backend/src/modules/students/students.module.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/students/students.module.ts) |

---

## 3. Database Models & Storage

### PostgreSQL (`Student`, `Parent`, `User`)
- **`Student`**:
  - `id`: UUID (Primary Key)
  - `admissionNo`: Unique string index (e.g. `ADM-2026-001`)
  - `rollNo`: Class section roll number
  - `photoUrl`: Candidate portrait photo URL (printed on Roll No Slips and Report Cards)
  - `discountPercentage`: Fee scholarship/discount % (e.g., 25% discount)
  - `customMonthlyFee`: Custom monthly fee override
  - `discountReason`: Concession justification (e.g., Merit Scholarship, Sibling Concession)
  - `schoolId`, `classId`, `sectionId`, `userId`, `parentId`
  - `emergencyContact`, `medicalNotes`
- **`Parent`**:
  - `id`: UUID (Primary Key)
  - `occupation`, `address`, `userId`
  - 1-to-many relationship with `Student` records

### MongoDB
- **`AuditLog`**: Logs all student admission approvals, section transfers, promotions, demotions, and academic year auto-progression events.

### Redis Cache
- `school:{schoolId}:students`: Cached student list for active academic session (TTL: 300s, invalidated on create/update).

---

## 4. API Endpoints

| Method | Endpoint | Access Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | `SUPER_ADMIN`, `ADMIN`, `TEACHER` | List students with optional `classId` / `sectionId` filters |
| `GET` | `/api/students/:id` | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `PARENT` | Get complete student profile with attendance & marks summary |
| `POST` | `/api/students` | `SUPER_ADMIN`, `ADMIN` | Register new student with optional photo, fee discounts, and linked accounts |
| `PATCH` | `/api/students/:id` | `SUPER_ADMIN`, `ADMIN` | Update student profile, photo, discounts, and section assignments |
| `DELETE` | `/api/students/:id` | `SUPER_ADMIN`, `ADMIN` | Soft delete / archive student record |
| `POST` | `/api/students/:id/promote` | `SUPER_ADMIN`, `ADMIN` | Directly promote student to next sequential grade class |
| `POST` | `/api/students/:id/demote` | `SUPER_ADMIN`, `ADMIN` | Directly demote student to previous grade class |
| `POST` | `/api/students/auto-progress` | `SUPER_ADMIN`, `ADMIN` | Automated academic year progression engine: analyzes final exam scores, auto-promotes eligible students, and flags at-risk students for manual intervention |
| `POST` | `/api/students/apply-progression-decisions` | `SUPER_ADMIN`, `ADMIN` | Applies bulk manual actions (`RETAIN`, `PROMOTE_WITH_GRACE`, `DEMOTE`) to flagged students |
