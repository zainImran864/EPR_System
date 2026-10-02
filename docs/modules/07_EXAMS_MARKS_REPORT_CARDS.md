# Module 07: Exams, Marks & Report Cards

## 1. Overview
The **Exams & Marks Module** oversees examination terms, grading scales, subject-wise score entries, automated GPA/grade computation, position ranking, and PDF/printable report card generation.

---

## 2. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **Marks Management View** | [`apps/school-erp/app/(dashboard)/marks/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/\(dashboard\)/marks/page.tsx) |
| **Batch Marks Entry Grid** | [`apps/school-erp/modules/marks/MarkEntryGrid.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/modules/marks/MarkEntryGrid.tsx) |
| **Paper Schedule Date-Sheet Modal** | [`apps/school-erp/modules/marks/ExamScheduleModal.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/modules/marks/ExamScheduleModal.tsx) |
| **Exam Analytics & At-Risk Insights** | [`apps/school-erp/modules/marks/ExamAnalyticsCard.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/modules/marks/ExamAnalyticsCard.tsx) |
| **Official Roll No Slip (Print)** | [`apps/school-erp/app/print/roll-no-slip/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/print/roll-no-slip/page.tsx) |
| **Transcript / Report Card (Print)** | [`apps/school-erp/app/print/report-card/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/print/report-card/page.tsx) |
| **Client Hook** | [`apps/school-erp/app/hooks/useMarks.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/hooks/useMarks.ts) |
| **REST API Connector** | [`apps/school-erp/app/api/client.ts` -> `marksRestApi`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/api/client.ts) |

---

## 3. Database Models & Storage

### PostgreSQL (`ExamTerm`, `ExamResult`, `ExamPaperSchedule`)
- **`ExamTerm`**:
  - `id`: UUID (Primary Key)
  - `name`: e.g. "Final Examination 2026", "Midterm 1"
  - `termType`: `MIDTERM_1`, `MIDTERM_2`, `FINAL`, `OTHER`
  - `startDate`, `endDate`, `academicYear`
- **`ExamPaperSchedule`**:
  - `id`: UUID (Primary Key)
  - `examTermId`, `classId`, `subjectId`, `schoolId`
  - `paperDate`: Date of examination
  - `startTime`, `endTime`: String (e.g. `09:00 AM`, `12:00 PM`)
  - `totalMarks`, `passingMarks`: Numerical scale
  - `roomNumber`: Hall / Examination room identifier
- **`ExamResult`**:
  - `id`: UUID (Primary Key)
  - `examTermId`, `studentId`, `subjectId`, `schoolId`
  - `marksObtained`: Float
  - `totalMarks`: Float
  - `grade`: String (computed A+, A, B, C, D, F)
  - `comments`: Teacher remarks

### MongoDB
- **`AuditLog`**: Logs grade submission and teacher alterations to examination results.

---

## 4. API Endpoints

| Method | Endpoint | Access Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/marks/exams` | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `PARENT` | List exam terms for active school |
| `POST` | `/api/marks/exams` | `SUPER_ADMIN`, `ADMIN` | Create new exam term |
| `GET` | `/api/marks/paper-schedules` | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT` | Get paper timetable/date-sheet for an exam term and class |
| `POST` | `/api/marks/paper-schedules` | `SUPER_ADMIN`, `ADMIN` | Save date-sheet paper timings, rooms, and total marks |
| `GET` | `/api/marks/roll-no-slips` | `SUPER_ADMIN`, `ADMIN`, `TEACHER` | Generate class batch Roll Number Slips with candidate photos and paper date-sheet |
| `GET` | `/api/marks/roll-no-slip/single` | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT` | Generate single candidate Roll No Slip (including re-take/supply exam slips) |
| `GET` | `/api/marks/report-card/:studentId` | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `PARENT` | Generate official student transcript supporting both **Term-Wise** and **Full-Year Cumulative** views |
| `GET` | `/api/marks/batch-report-cards` | `SUPER_ADMIN`, `ADMIN` | Batch report cards for an entire section |
| `GET` | `/api/marks/analytics/:examTermId` | `SUPER_ADMIN`, `ADMIN`, `TEACHER` | Class performance analytics, pass rates, and at-risk student detection |
| `POST` | `/api/marks/bulk` | `SUPER_ADMIN`, `ADMIN`, `TEACHER` | Submit marks for multiple students in batch |
