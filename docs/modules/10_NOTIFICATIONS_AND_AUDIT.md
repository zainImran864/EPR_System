# Module 10: Notifications, WhatsApp Hub & Audit Logging

## 1. Overview
The **Notifications, WhatsApp Hub & Audit Logging Module** manages multi-channel communications across in-app alerts (MongoDB + Redis Pub/Sub), direct & broadcast WhatsApp communications (`https://wa.me/` protocol integration), and immutable security audit logs for multi-tenant school operations.

---

## 2. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **WhatsApp Communication Center** | [`apps/school-erp/modules/notifications/WhatsAppCenter.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/notifications/WhatsAppCenter.tsx) |
| **Admin WhatsApp Hub Page** | [`apps/school-erp/app/admin/whatsapp/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/admin/whatsapp/page.tsx) |
| **Teacher WhatsApp Hub Page** | [`apps/school-erp/app/teacher/whatsapp/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/teacher/whatsapp/page.tsx) |
| **In-App Broadcast Center** | [`apps/school-erp/modules/notifications/BroadcastCenter.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/notifications/BroadcastCenter.tsx) |
| **Notification Center / Bell Dropdown** | [`apps/school-erp/components/layout/NotificationBell.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/components/layout/NotificationBell.tsx) |
| **WhatsApp & Notifications REST Connector** | [`apps/school-erp/app/api/client.ts` -> `whatsappRestApi`, `notificationsRestApi`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/api/client.ts) |

### Backend Layer
| Purpose | File Path |
| :--- | :--- |
| **WhatsApp Module, Service & Controller** | [`apps/school-erp-backend/src/modules/whatsapp/`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/whatsapp/) |
| **Notification Controller & Service** | [`apps/school-erp-backend/src/modules/notifications/`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/notifications/) |
| **Audit Controller & Service** | [`apps/school-erp-backend/src/modules/audit/`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/audit/) |
| **MongoDB Schema Definitions** | [`apps/school-erp-backend/src/database/schemas/`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/database/schemas/) |

---

## 3. WhatsApp Communication Hub & Click-to-Chat Architecture

### Direct & Broadcast Messaging Flow
1. **Phone Number Normalization**: Strips invalid symbols, leading zeros, and prefixes international country code (e.g. `03001234567` -> `923001234567`).
2. **Dynamic Variable Token Replacement**: Supports contextual tags in messages and templates:
   - `{student_name}`, `{parent_name}`, `{guardian_name}`
   - `{school_name}`
   - `{grade}`, `{section}`, `{roll_no}`, `{exam_name}`, `{percentage}`, `{obtained_marks}`, `{total_marks}`
   - `{amount}`, `{due_date}`, `{month}`, `{balance}`
   - `{date}`, `{status}`
3. **1-Click WhatsApp Web / Native App Launch**: Generates `https://wa.me/<phone>?text=<encoded_payload>` for instant, zero-friction dispatch on desktop browsers and mobile devices.
4. **Backend Audit Trail**: Logs dispatches for security and communication verification.

### Embedded 1-Click WhatsApp Quick Actions
- **Student Directory**: Clickable WhatsApp button in Guardian Contact column to message parent.
- **Fee Management**: 1-click WhatsApp button on unpaid fee challans with student name, outstanding amount, and due date reminder.
- **Marks & Exam Rosters**: 1-click WhatsApp share button to send student's subject score, percentage, and grade breakdown to guardian.

---

## 4. API Endpoints

### WhatsApp Endpoints
| Method | Endpoint | Access Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/whatsapp/send-direct` | `ADMIN`, `TEACHER` | Prepare and log direct WhatsApp chat link |
| `POST` | `/api/whatsapp/send-batch` | `ADMIN`, `TEACHER` | Generate personalized batch WhatsApp links for a class or faculty |
| `POST` | `/api/whatsapp/send-report-card` | `ADMIN`, `TEACHER` | Generate formatted transcript WhatsApp message |
| `POST` | `/api/whatsapp/send-fee-reminder` | `ADMIN` | Generate fee challan payment reminder link |
| `POST` | `/api/whatsapp/send-attendance-alert`| `ADMIN`, `TEACHER` | Generate student absent/leave alert |
| `GET` | `/api/whatsapp/recipients` | `ADMIN`, `TEACHER` | Fetch structured directory of teachers and class-grouped parents |
| `GET` | `/api/whatsapp/templates` | `ADMIN`, `TEACHER` | Retrieve preset templates (Academic, Fee, Attendance, Exams) |

### Notifications & Audit Endpoints
| Method | Endpoint | Access Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | All Authenticated Users | Fetch user's in-app notification feed |
| `PATCH` | `/api/notifications/:id/read` | All Authenticated Users | Mark specific notification as read |
| `POST` | `/api/notifications/broadcast` | `SUPER_ADMIN`, `ADMIN` | Send school-wide or class-wide in-app alert |
| `GET` | `/api/audit` | `SUPER_ADMIN` | Search immutable audit trail with filters |
