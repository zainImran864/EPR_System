# Module 01: Authentication & Security

## 1. Feature Description & Capabilities
- **Multi-Tenant User Authentication:** Login with school-scoped email and encrypted password (bcrypt, 10 rounds).
- **Role-Based Access Control (RBAC):** Strict roles (`SUPERADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`).
- **Two-Factor Authentication (2FA):** TOTP (Google Authenticator) with QR code enrollment and trusted devices.
- **Session Caching:** JWT session metadata cached in Redis for fast token validation.
- **User Theme Personalization:** Runtime sidebar accent color stored per user.

---

## 2. Backend Files & Implementation
- **Module:** [`apps/school-erp-backend/src/modules/auth/auth.module.ts`](../../apps/school-erp-backend/src/modules/auth/auth.module.ts)
- **Controller:** [`apps/school-erp-backend/src/modules/auth/auth.controller.ts`](../../apps/school-erp-backend/src/modules/auth/auth.controller.ts)
- **Service:** [`apps/school-erp-backend/src/modules/auth/auth.service.ts`](../../apps/school-erp-backend/src/modules/auth/auth.service.ts)
- **Strategy:** [`apps/school-erp-backend/src/modules/auth/jwt.strategy.ts`](../../apps/school-erp-backend/src/modules/auth/jwt.strategy.ts)
- **Guards:** [`apps/school-erp-backend/src/common/guards/jwt-auth.guard.ts`](../../apps/school-erp-backend/src/common/guards/jwt-auth.guard.ts), [`roles.guard.ts`](../../apps/school-erp-backend/src/common/guards/roles.guard.ts)
- **DTOs:** [`apps/school-erp-backend/src/modules/auth/dto/auth.dto.ts`](../../apps/school-erp-backend/src/modules/auth/dto/auth.dto.ts) (`LoginDto`, `RegisterSchoolDto`, `ChangePasswordDto`, `UpdateThemeDto`)
- **Database Model (Prisma):** `model User`, `model Session`

### Key Endpoints:
- `POST /api/auth/login`: Authenticate user, return JWT and user profile.
- `POST /api/auth/register-school`: Submit new school registration request.
- `GET /api/auth/me`: Fetch authenticated user profile and school details.
- `POST /api/auth/change-password`: Change user password.
- `PATCH /api/auth/theme`: Persist user sidebar accent color.

---

## 3. Frontend Files & Implementation
- **API Client:** [`apps/school-erp/app/api/auth.ts`](../../apps/school-erp/app/api/auth.ts) (`authRestApi`)
- **Login Page:** [`apps/school-erp/app/login/page.tsx`](../../apps/school-erp/app/login/page.tsx)
- **Registration Page:** [`apps/school-erp/app/register/page.tsx`](../../apps/school-erp/app/register/page.tsx)
- **Account Settings:** [`apps/school-erp/modules/settings/AccountSettings.tsx`](../../apps/school-erp/modules/settings/AccountSettings.tsx)
- **2FA Enrollment Modal:** [`apps/school-erp/modules/settings/TwoFactorModal.tsx`](../../apps/school-erp/modules/settings/TwoFactorModal.tsx)
- **Hooks & Store:** [`apps/school-erp/app/hooks/useAuth.ts`](../../apps/school-erp/app/hooks/useAuth.ts), [`apps/school-erp/app/store/useAuthStore.ts`](../../apps/school-erp/app/store/useAuthStore.ts)
