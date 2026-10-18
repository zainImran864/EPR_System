# Module 14: Offline Attendance, PWA, Automated Backups & Localization

## 1. Overview
This module covers progressive offline reliability, field-ready mobile PWA support, teacher campus geofencing with official school operational hours, automated database backups, and multi-language support (English and Urdu with RTL).

---

## 2. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **PWA Service Worker** | [`apps/school-erp/public/sw.js`](file:///mnt/drive4/School_epr_system/apps/school-erp/public/sw.js) |
| **Web App Manifest** | [`apps/school-erp/app/manifest.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/manifest.ts) |
| **Offline Attendance Queue Hook** | [`apps/school-erp/app/hooks/useAttendance.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/hooks/useAttendance.ts) |
| **Attendance Sheet with Offline Sync** | [`apps/school-erp/modules/attendance/AttendanceSheet.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/attendance/AttendanceSheet.tsx) |
| **Language Toggle Component** | [`apps/school-erp/components/layout/LanguageToggle.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/components/layout/LanguageToggle.tsx) |
| **Language Store & Urdu Dictionary** | [`apps/school-erp/app/stores/useLanguageStore.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/stores/useLanguageStore.ts) |
| **Admin System Settings (Backups & Hours)** | [`apps/school-erp/modules/settings/SettingsView.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/modules/settings/SettingsView.tsx) |

### Backend Layer
| Purpose | File Path |
| :--- | :--- |
| **Backup Service & Controller** | [`apps/school-erp-backend/src/modules/backup/`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/backup/) |
| **Attendance Service (Geofence & Hours)** | [`apps/school-erp-backend/src/modules/attendance/attendance.service.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/attendance/attendance.service.ts) |

---

## 3. Key Capabilities & Logic

### 1. Offline Student Attendance Marking & Auto-Sync
- If a teacher has unstable internet connectivity in classrooms, the attendance UI detects offline status (`navigator.onLine === false`).
- Attendance sheets are saved locally to `localStorage` (`academix_offline_attendance_queue`) with a visual `WifiOff` badge and counter.
- As soon as connectivity is restored, the queue is automatically flushed to `POST /api/attendance/bulk`, with an option for manual sync.

### 2. Teacher Live Attendance Geofence & School Hours Enforcement
- **Geofence Check**: Verifies teacher GPS coordinates against the school location using the Haversine formula (radius default `250m`).
- **School Hours Window**: School Admins configure official school start and end times (e.g., `07:30` to `14:00`).
- If a teacher attempts to check in outside the configured school hours, check-in is blocked with an alert: *"Self-attendance is only permitted during official school hours"*.

### 3. Automated & Manual Database Backups
- **Automated Schedule**: Configurable daily backup time (e.g., `02:00 AM`).
- **Instant Snapshot**: School Admins can trigger **"Backup Database Now"** on demand from `/admin/settings`.
- Safe JSON snapshot of multi-tenant tables (`students`, `teachers`, `attendance`, `feeChallans`, `marks`, `expenses`) written to `/backups` directory, preventing data loss.

### 4. Multi-Language Support (English & Urdu اردو with RTL)
- Dedicated language switcher in the Topbar.
- Supports English (`en`, `ltr`) and Urdu (`ur`, `rtl`).
- User preference is saved per-user session and dynamically updates `dir="rtl"` and `lang="ur"` on `document.documentElement`.
- Covers core navigation, statuses, buttons, and dashboard headers.

### 5. Progressive Web App (PWA)
- Full service worker caching strategy for static assets and shell pages.
- Standard manifest configuration (`display: standalone`, theme color, school icons) allowing installation directly to Android, iOS, Windows, and macOS home screens.
