# Module 10: Notifications & Audit Logging

## 1. Overview
The **Notifications & Audit Logging Module** manages real-time broadcast and targeted notifications (via MongoDB & Redis Pub/Sub) as well as immutable system activity tracking, security forensics, and compliance auditing.

---

## 2. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **Notification Center / Bell Dropdown** | [`apps/school-erp/app/components/shared/NotificationPopover.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/shared/NotificationPopover.tsx) |
| **Audit Log Explorer (Super Admin)** | [`apps/school-erp/app/(dashboard)/audit/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/\(dashboard\)/audit/page.tsx) |
| **REST API Connector** | [`apps/school-erp/app/api/client.ts` -> `notificationsRestApi`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/api/client.ts) |

### Backend Layer
| Purpose | File Path |
| :--- | :--- |
| **Notification Controller & Service** | [`apps/school-erp-backend/src/modules/notifications/`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/notifications/) |
| **Audit Controller & Service** | [`apps/school-erp-backend/src/modules/audit/`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/audit/) |
| **MongoDB Schema Definitions** | [`apps/school-erp-backend/src/database/schemas/`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/database/schemas/) |

---

## 3. Database Models & Storage

### MongoDB (`NotificationDocument`, `AuditLogDocument`)
- **`Notification`**:
  - `userId`: Target recipient UUID
  - `schoolId`: Associated school
  - `title`, `message`, `type` (`INFO`, `WARNING`, `SUCCESS`, `ALERT`)
  - `isRead`: Boolean
  - `createdAt`: ISODate
- **`AuditLog`**:
  - `userId`, `action` (e.g. `USER_LOGIN`, `SUBMIT_MARKS`, `COLLECT_FEE`, `DELETE_STUDENT`)
  - `entity`: Name of entity affected (`Student`, `FeeChallan`, etc.)
  - `entityId`: Target ID
  - `ipAddress`, `userAgent`, `metadata` (JSON payload of diff / changes)

### Redis Pub/Sub
- `channel:notifications:{userId}`: Real-time message streaming.

---

## 4. API Endpoints

| Method | Endpoint | Access Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | All Authenticated Users | Fetch user's notification feed |
| `PATCH` | `/api/notifications/:id/read` | All Authenticated Users | Mark specific notification as read |
| `POST` | `/api/notifications/broadcast` | `SUPER_ADMIN`, `ADMIN` | Send school-wide or class-wide alert |
| `GET` | `/api/audit` | `SUPER_ADMIN` | Search immutable audit trail with filters |
