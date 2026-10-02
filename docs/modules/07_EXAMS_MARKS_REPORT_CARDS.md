# Module 07: Exams, Marks & Report Cards

## 1. Overview
The **Exams & Marks Module** oversees examination terms, grading scales, paper timetable date-sheets, official printable roll number slips (admit cards), multi-version exam question papers with structured questions & marks, subject-wise score entries with strict teacher RBAC rules, automated GPA/grade computation, and comprehensive printable report card transcripts (term-wise & full cumulative).

---

## 2. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **Marks Management View** | [`apps/school-erp/app/(dashboard)/marks/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/\(dashboard\)/marks/page.tsx) |
| **Batch Marks Entry Grid** | [`apps/school-erp/modules/marks/MarkEntryGrid.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/marks/MarkEntryGrid.tsx) |
| **Paper Schedule Date-Sheet Modal** | [`apps/school-erp/modules/marks/ExamScheduleModal.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/marks/ExamScheduleModal.tsx) |
| **Question Paper Manager Modal** | [`apps/school-erp/modules/marks/QuestionPaperManagerModal.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/modules/marks/QuestionPaperManagerModal.tsx) |
| **Exam Analytics & At-Risk Insights** | [`apps/school-erp/modules/marks/ExamAnalyticsCard.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/marks/ExamAnalyticsCard.tsx) |
| **Official Roll No Slip (Print)** | [`apps/school-erp/app/print/roll-no-slip/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/print/roll-no-slip/page.tsx) |
| **Official Question Paper (Print)** | [`apps/school-erp/app/print/question-paper/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/print/question-paper/page.tsx) |
| **Transcript / Report Card (Print)** | [`apps/school-erp/app/print/report-card/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/print/report-card/page.tsx) |
| **Client Hook** | [`apps/school-erp/app/hooks/useMarks.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/hooks/useMarks.ts) |
| **REST API Connector** | [`apps/school-erp/app/api/client.ts` -> `marksRestApi`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/api/client.ts) |

### Backend Layer
| Purpose | File Path |
| :--- | :--- |
| **Controller** | [`apps/school-erp-backend/src/modules/marks/marks.controller.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/marks/marks.controller.ts) |
| **Service** | [`apps/school-erp-backend/src/modules/marks/marks.service.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/marks/marks.service.ts) |
| **DTOs** | [`apps/school-erp-backend/src/modules/marks/dto/marks.dto.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/marks/dto/marks.dto.ts) |
| **Module Definition** | [`apps/school-erp-backend/src/modules/marks/marks.module.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/marks/marks.module.ts) |

---

## 3. Database Models & Storage

### PostgreSQL (`ExamTerm`, `ExamResult`, `ExamPaperSchedule`, `ExamQuestionPaper`)
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
- **`ExamQuestionPaper`**:
  - `id`: UUID (Primary Key)
  - `schoolId`, `examTermId`, `classId`, `subjectId`, `teacherId`
  - `title`: e.g. "Mathematics Midterm Paper — Set A"
  - `durationHours`: Float (e.g. 2.5)
  - `totalMarks`: Float (e.g. 100)
  - `instructions`: Candidate instructions
  - `fileUrl`: Document / DOCX / PDF upload link
  - `questionsJson`: Structured question hierarchy with per-question marks
  - `isActiveForExam`: Boolean flag indicating official paper selected for the exam
  - `version`: Sequential version integer
- **`ExamResult` / `Mark`**:
  - `id`: UUID (Primary Key)
  - `examTermId`, `studentId`, `subjectId`, `schoolId`
  - `marksObtained`: Float
  - `totalMarks`: Float
  - `grade`: String (computed A+, A, B, C, D, F)
  - `comments`: Teacher remarks

### Role-Based Access Control (RBAC) & Academic Integrity Policies
- **Class Teacher**:
  - Can view all subjects' scores and results for their assigned class section.
  - Can generate & print full **Class Report Cards** and all **Roll No Slips**.
  - Can **only enter/update marks** for the subject(s) they directly teach.
- **Subject Teacher**:
  - Can view and enter marks **strictly for their own assigned subject**.
  - Can upload multiple Question Paper versions and author structured questions for their subject.
- **Administrator / Principal**:
  - Has full visibility into all class sections, date-sheets, report cards, roll number slips, and question papers.
  - Restricted from direct score modification (marks must be submitted by subject teachers to ensure grading integrity).

---

## 4. API Endpoints

| Method | Endpoint | Access Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/marks/teacher-context` | `TEACHER` | Returns teacher profile, class teacher section assignments, and taught subjects list |
| `GET` | `/api/marks/exam-terms` | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `PARENT` | List exam terms for active school |
| `POST` | `/api/marks/exam-terms` | `SUPER_ADMIN`, `ADMIN` | Create new exam term |
| `GET` | `/api/marks/paper-schedules` | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT` | Get paper timetable/date-sheet for an exam term and class |
| `POST` | `/api/marks/paper-schedules` | `SUPER_ADMIN`, `ADMIN` | Save date-sheet paper timings, rooms, and total marks |
| `GET` | `/api/marks/roll-no-slips` | `SUPER_ADMIN`, `ADMIN`, `TEACHER` | Generate class batch Roll Number Slips with candidate photos and paper date-sheet |
| `GET` | `/api/marks/roll-no-slip/:studentId` | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT` | Generate single candidate Roll No Slip (including re-take/supply exam slips) |
| `GET` | `/api/marks/report-card/:studentId` | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `PARENT` | Generate official student transcript supporting both **Term-Wise** and **Full-Year Cumulative** views |
| `GET` | `/api/marks/batch-report-cards` | `SUPER_ADMIN`, `ADMIN`, `TEACHER` | Batch report cards for an entire section (accessible by Admin and Class Teacher) |
| `GET` | `/api/marks/analytics` | `SUPER_ADMIN`, `ADMIN`, `TEACHER` | Class performance analytics, pass rates, and at-risk student detection |
| `POST` | `/api/marks/save` | `TEACHER` | Submit marks for multiple students (restricted to teacher's taught subject) |
| `POST` | `/api/marks/question-papers` | `ADMIN`, `TEACHER` | Create / upload exam question paper with duration, total marks, and structured questions |
| `GET` | `/api/marks/question-papers` | `ADMIN`, `TEACHER` | List all question paper versions for an exam term, class, and subject |
| `PATCH` | `/api/marks/question-papers/:id/set-active` | `ADMIN`, `TEACHER` | Set specific question paper version as the official active paper for printing |
| `DELETE` | `/api/marks/question-papers/:id` | `ADMIN`, `TEACHER` | Delete question paper draft |
| `GET` | `/api/marks/question-paper/print/:id` | `ADMIN`, `TEACHER` | Retrieve printable question paper formatted with school header, duration, marks, and questions |
