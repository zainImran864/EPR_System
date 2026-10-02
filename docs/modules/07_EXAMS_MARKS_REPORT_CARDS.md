# Module 07: Exams, Marks & Report Cards

## 1. Overview
The **Exams & Marks Module** oversees examination terms, grading scales, subject-wise score entries, automated GPA/grade computation, position ranking, and PDF/printable report card generation.

---

## 2. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **Marks Management View** | [`apps/school-erp/app/(dashboard)/marks/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/\(dashboard\)/marks/page.tsx) |
| **Batch Marks Entry Grid** | [`apps/school-erp/app/components/marks/MarksEntryForm.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/marks/MarksEntryForm.tsx) |
| **Report Card Print Layout** | [`apps/school-erp/app/components/marks/ReportCardView.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/marks/ReportCardView.tsx) |
| **Client Hook** | [`apps/school-erp/app/hooks/useMarks.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/hooks/useMarks.ts) |
| **REST API Connector** | [`apps/school-erp/app/api/client.ts` -> `marksRestApi`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/api/client.ts) |

### Backend Layer
| Purpose | File Path |
| :--- | :--- |
| **Controller** | [`apps/school-erp-backend/src/modules/marks/marks.controller.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/marks/marks.controller.ts) |
| **Service** | [`apps/school-erp-backend/src/modules/marks/marks.service.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/marks/marks.service.ts) |
| **DTOs** | [`apps/school-erp-backend/src/modules/marks/dto/submit-marks.dto.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/marks/dto/submit-marks.dto.ts) |
| **Module Definition** | [`apps/school-erp-backend/src/modules/marks/marks.module.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/marks/marks.module.ts) |

---

## 3. Database Models & Storage

### PostgreSQL (`Exam`, `ExamResult`)
- **`Exam`**:
  - `id`: UUID (Primary Key)
  - `title`: e.g. "Midterm Examinations 2026"
  - `term`: `FIRST_TERM`, `MID_TERM`, `FINAL_TERM`
  - `startDate`, `endDate`, `academicYear`
- **`ExamResult`**:
  - `id`: UUID (Primary Key)
  - `examId`, `studentId`, `subjectId`, `schoolId`
  - `marksObtained`: Float
  - `maxMarks`: Float
  - `grade`: String (computed A+, A, B, C, D, F)
  - `comments`: Teacher remarks

### MongoDB
- **`AuditLog`**: Logs grade submission and teacher alterations to examination results.

---

## 4. API Endpoints

| Method | Endpoint | Access Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/marks/exams` | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `PARENT` | List exams for active school |
| `POST` | `/api/marks/exams` | `SUPER_ADMIN`, `ADMIN` | Create new exam schedule |
| `GET` | `/api/marks` | `SUPER_ADMIN`, `ADMIN`, `TEACHER` | Get marks filtered by exam, subject, and class |
| `POST` | `/api/marks/bulk` | `SUPER_ADMIN`, `ADMIN`, `TEACHER` | Submit marks for multiple students in batch |
| `GET` | `/api/marks/student/:studentId` | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `PARENT` | Generate complete report card for student |
