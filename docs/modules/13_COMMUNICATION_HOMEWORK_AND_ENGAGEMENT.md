# Module 13: Communication, Homework & Student Engagement Engine

## 1. Overview
This module unifies academic communication, assignment tracking with strict deadline locks, parent-teacher collaboration, multi-child switching, and gamified student engagement badges.

---

## 2. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **Circulars & Announcements Page** | [`apps/school-erp/app/admin/circulars/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/admin/circulars/page.tsx) (`/teacher/circulars`, `/student/circulars`, `/parent/circulars`) |
| **Circulars View Component** | [`apps/school-erp/modules/circulars/CircularsView.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/circulars/CircularsView.tsx) |
| **Teacher Homework Page** | [`apps/school-erp/app/teacher/homework/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/teacher/homework/page.tsx) |
| **Teacher Homework View** | [`apps/school-erp/modules/homework/TeacherHomeworkView.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/homework/TeacherHomeworkView.tsx) |
| **Student/Parent Homework Page** | [`apps/school-erp/app/student/homework/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/student/homework/page.tsx) & [`app/parent/homework/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/parent/homework/page.tsx) |
| **Student Homework View** | [`apps/school-erp/modules/homework/StudentHomeworkView.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/homework/StudentHomeworkView.tsx) |
| **Parent-Teacher Meetings (PTM)** | [`apps/school-erp/app/teacher/ptm/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/teacher/ptm/page.tsx) (`/parent/ptm`, `/admin/ptm`) |
| **PTM View Component** | [`apps/school-erp/modules/meetings/ParentTeacherMeetingView.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/meetings/ParentTeacherMeetingView.tsx) |
| **Student Achievements Page** | [`apps/school-erp/app/student/achievements/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/student/achievements/page.tsx) & [`app/parent/achievements/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/parent/achievements/page.tsx) |
| **Achievements View Component** | [`apps/school-erp/modules/students/StudentAchievementsView.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/students/StudentAchievementsView.tsx) |
| **Multi-Child Switcher** | [`apps/school-erp/components/layout/Topbar.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/components/layout/Topbar.tsx) & [`useParentStore.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/stores/useParentStore.ts) |

### Backend Layer
| Purpose | File Path |
| :--- | :--- |
| **Circulars Module** | [`apps/school-erp-backend/src/modules/circulars/`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/circulars/) |
| **Homework Module** | [`apps/school-erp-backend/src/modules/homework/`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/homework/) |
| **Meetings (PTM) Module** | [`apps/school-erp-backend/src/modules/meetings/`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/meetings/) |
| **Achievements Service** | [`apps/school-erp-backend/src/modules/students/achievements.service.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/students/achievements.service.ts) |
| **Student Leave & Absence Alert** | [`apps/school-erp-backend/src/modules/attendance/`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/attendance/) |

---

## 3. Key Capabilities & Logic

### 1. Class & Section Targeted Circulars
- Created by Admin or Teacher with rich content and attachment support.
- Scoped to `ALL`, `TEACHERS`, `STUDENTS`, `PARENTS`, or a specific `CLASS` and `SECTION`.
- Automatically dispatches real-time in-app notifications to target users.

### 2. Homework & Assignments with Hard Deadline Lock
- Teachers define questions, instructions, attachments, maximum marks, and submission deadline (`dueDateTime`).
- **Strict Enforcement**:
  - Within deadline: Students submit written text or upload solution files (`SUBMITTED`).
  - After deadline: Submissions are locked. If a student attempts to submit late or misses the window, status is automatically locked to `MISSED` with `marksObtained: 0`.
- **Grading & Feedback**: Teachers review submitted files, assign marks, and write constructive feedback notes.

### 3. Parent-Teacher Meeting (PTM) Management
- Teachers schedule meetings with student parents with specified date, time slot, and mode (`IN_PERSON` or `ONLINE` video link).
- Parents accept or decline with notes. Real-time notifications update both parties instantly.

### 4. Student Achievement Stars & Gamification Engine
- Four badges evaluated and auto-calculated based on live performance data:
  1. ⭐ **Weekly Attendance Star**: Awarded for 100% attendance during the current week with zero absences.
  2. 🏆 **Academic Excellence Star**: Awarded when the student's cumulative exam average reaches 80% or above.
  3. 🌟 **Homework Champion**: Awarded when all assigned homeworks are completed on time.
  4. ⏱️ **Punctuality Master**: Awarded for maintaining perfect on-time attendance with 0 late arrivals.
- Interactive showcase displays unlocked trophies, progress bars, and historical achievements.

### 5. Multi-Child Parent Switcher
- Parents with 2 or more enrolled children can toggle between them in the Topbar dropdown.
- Selecting a child updates the active student context across all views (Attendance, Marks, Fees, Homework, Achievements).

### 6. Student Leave Request & Real-Time Absence Notifications
- Parents submit leave applications directly from the portal with date range and reason.
- Teachers or Admins approve or reject the request. Approved leaves automatically populate the student's attendance records as `LEAVE`.
- When a student is marked `ABSENT` during roll call, an instant high-priority notification is dispatched to their parent.
