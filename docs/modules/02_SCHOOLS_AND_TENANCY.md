# Module 02: Schools, Multi-Tenancy & SMTP Mailer Configuration

## 1. Feature Description & Capabilities
- **Tenant Isolation:** Every school has isolated data scoped strictly by `schoolId`.
- **Custom Branding:** Each school configures its name, logo URL, and primary theme color.
- **Custom School SMTP:** Administrators configure their own school mail server (Host, Port, Username, Password, SSL/TLS, and From Address) so credentials and notifications are sent from their domain.
- **Live SMTP Verification & Test Email:** Built-in connection testing handshake with live test email delivery via `nodemailer`.
- **SuperAdmin Approval Queue:** Public self-registration queue where platform SuperAdmins review, approve, or reject school onboarding.
- **Automated School Provisioning:** Approving a school automatically provisions the school, the admin user, and grades 1-10 with default sections.

---

## 2. Backend Files & Implementation
- **Module:** [`apps/school-erp-backend/src/modules/schools/schools.module.ts`](../../apps/school-erp-backend/src/modules/schools/schools.module.ts)
- **Controller:** [`apps/school-erp-backend/src/modules/schools/schools.controller.ts`](../../apps/school-erp-backend/src/modules/schools/schools.controller.ts)
- **Service:** [`apps/school-erp-backend/src/modules/schools/schools.service.ts`](../../apps/school-erp-backend/src/modules/schools/schools.service.ts)
- **DTOs:** [`apps/school-erp-backend/src/modules/schools/dto/school.dto.ts`](../../apps/school-erp-backend/src/modules/schools/dto/school.dto.ts) (`UpdateSchoolDto`, `UpdateSmtpDto`, `TestSmtpDto`)
- **Database Models (Prisma):** `model School`, `model RegistrationRequest`

### Key Endpoints:
- `GET /api/schools/by-code/:code`: Public lookup of school branding by code.
- `GET /api/schools/current`: Get current school configuration for authenticated session.
- `PATCH /api/schools/current`: Update school branding and contact info.
- `GET /api/schools/current/smtp`: Retrieve SMTP configuration (passwords masked).
- `PATCH /api/schools/current/smtp`: Save or update custom SMTP credentials.
- `POST /api/schools/current/smtp/test`: Run live SMTP connection test & send verification email.
- `GET /api/schools/superadmin/all`: SuperAdmin list of all registered schools.
- `GET /api/schools/superadmin/pending-requests`: SuperAdmin registration queue.
- `POST /api/schools/superadmin/requests/:id/approve`: Approve registration and provision tenant.
- `POST /api/schools/superadmin/requests/:id/reject`: Reject registration with reason.

---

## 3. Frontend Files & Implementation
- **API Client:** [`apps/school-erp/app/api/client.ts` -> `schoolsRestApi`](../../apps/school-erp/app/api/client.ts), [`schools.ts`](../../apps/school-erp/app/api/schools.ts)
- **Admin Settings View:** [`apps/school-erp/app/admin/settings/page.tsx`](../../apps/school-erp/app/admin/settings/page.tsx)
- **School Branding Settings:** [`apps/school-erp/modules/settings/SchoolSettings.tsx`](../../apps/school-erp/modules/settings/SchoolSettings.tsx)
- **SMTP Settings & Testing Component:** [`apps/school-erp/modules/settings/SmtpSettings.tsx`](../../apps/school-erp/modules/settings/SmtpSettings.tsx)
- **SuperAdmin Dashboard:** [`apps/school-erp/app/superadmin/dashboard/page.tsx`](../../apps/school-erp/app/superadmin/dashboard/page.tsx)
