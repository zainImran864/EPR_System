# Module 09: Timetable, Teacher Schedules & Multi-Class Room Scheduling

## 1. Overview
The **Timetable & Scheduling Module** handles the weekly master schedules for school classes, sections, teachers, and students. It features automated collision avoidance (preventing conflicting teacher assignments) while offering support for **multi-class shared rooms** (e.g. combined lectures, physical education, auditoriums, and laboratories).

---

## 2. Key Features

### A. Teacher Weekly Timetable
- Teachers can inspect their exact weekly teaching schedule across all classes and sections they teach.
- Displays classroom / room numbers, period timings, class names, and subject details.
- Real-time synchronization when administrators modify slot allocations.

### B. Student & Parent Timetable View
- Students and parents have a dedicated timetable portal showing their active section's weekly routine.
- Clear indicators for subject, teacher name, start/end time, and room number.

### C. Multi-Class & Shared Room Support
- Two or more classes/sections can be scheduled in the same room simultaneously for joint sessions (e.g. Auditorium lectures, Library hours, Combined Gymnasium / Sports periods).
- Timetable grids stack joint sessions with visual `Joint` badges.

---

## 3. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **Admin Timetable & Room Builder** | [`apps/school-erp/app/admin/timetable/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/admin/timetable/page.tsx) & [`apps/school-erp/modules/timetable/TimetableBuilder.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/timetable/TimetableBuilder.tsx) |
| **Teacher Timetable View** | [`apps/school-erp/app/teacher/timetable/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/teacher/timetable/page.tsx) |
| **Student Timetable View** | [`apps/school-erp/app/student/timetable/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/student/timetable/page.tsx) & [`apps/school-erp/modules/timetable/MyTimetableView.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/timetable/MyTimetableView.tsx) |
| **Parent Timetable View** | [`apps/school-erp/app/parent/timetable/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/parent/timetable/page.tsx) |
| **Weekly Matrix Component** | [`apps/school-erp/modules/timetable/TimetableGrid.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/timetable/TimetableGrid.tsx) |
| **Client Hook** | [`apps/school-erp/app/hooks/useTimetable.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/hooks/useTimetable.ts) |
| **REST API Connector** | [`apps/school-erp/app/api/client.ts` -> `timetableRestApi`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/api/client.ts) |

### Backend Layer
| Purpose | File Path |
| :--- | :--- |
| **Controller** | [`apps/school-erp-backend/src/modules/timetable/timetable.controller.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/timetable/timetable.controller.ts) |
| **Service** | [`apps/school-erp-backend/src/modules/timetable/timetable.service.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/timetable/timetable.service.ts) |
| **DTOs** | [`apps/school-erp-backend/src/modules/timetable/dto/timetable.dto.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/timetable/dto/timetable.dto.ts) |
| **Module Definition** | [`apps/school-erp-backend/src/modules/timetable/timetable.module.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/timetable/timetable.module.ts) |

---

## 4. Database Models & Storage

### PostgreSQL (`TimetableEntry`)
- `id`: CUID (Primary Key)
- `schoolId`, `sectionId`, `subjectId`, `teacherId`
- `dayOfWeek`: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`
- `periodNumber`: Integer (1–10)
- `startTime`: String (e.g. `08:30`)
- `endTime`: String (e.g. `09:15`)
- `room`: String (e.g. `Room 101`, `Auditorium`)

---

## 5. API Endpoints

| Method | Endpoint | Access Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/timetable/my` | `TEACHER`, `STUDENT`, `PARENT` | Dynamically returns authenticated user's personal timetable |
| `GET` | `/api/timetable/section/:sectionId` | All Authenticated | Get weekly schedule for a specific class section |
| `GET` | `/api/timetable/teacher/:teacherId` | `ADMIN`, `TEACHER` | Get complete teaching schedule across all classes for a teacher |
| `GET` | `/api/timetable/student/:studentId` | `ADMIN`, `TEACHER`, `PARENT` | Get timetable for a specific student |
| `POST` | `/api/timetable/entry` | `ADMIN`, `SUPERADMIN` | Create or update period slot with room assignment & joint class options |
| `DELETE` | `/api/timetable/entry/:id` | `ADMIN`, `SUPERADMIN` | Delete timetable slot |
