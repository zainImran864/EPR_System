# Module 08: Fee Structure, Invoices & Challan Management

## 1. Overview
The **Fees & Challan Management Module** handles fee head definitions (Tuition, Lab, Library, Sports), batch invoice generation, student fee challan issuance, partial payments, discount policies, and payment reconciliation.

---

## 2. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **Fees & Accounts Ledger** | [`apps/school-erp/app/(dashboard)/fees/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/\(dashboard\)/fees/page.tsx) |
| **Fee Challan Print Template** | [`apps/school-erp/app/components/fees/ChallanPrintModal.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/fees/ChallanPrintModal.tsx) |
| **Collect Fee Modal** | [`apps/school-erp/app/components/fees/CollectFeeDialog.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/components/fees/CollectFeeDialog.tsx) |
| **Client Hook** | [`apps/school-erp/app/hooks/useAccount.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/hooks/useAccount.ts) |
| **REST API Connector** | [`apps/school-erp/app/api/client.ts` -> `feesRestApi`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/api/client.ts) |

### Backend Layer
| Purpose | File Path |
| :--- | :--- |
| **Controller** | [`apps/school-erp-backend/src/modules/fees/fees.controller.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/fees/fees.controller.ts) |
| **Service** | [`apps/school-erp-backend/src/modules/fees/fees.service.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/fees/fees.service.ts) |
| **DTOs** | [`apps/school-erp-backend/src/modules/fees/dto/create-fee-structure.dto.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/fees/dto/create-fee-structure.dto.ts) |
| **Module Definition** | [`apps/school-erp-backend/src/modules/fees/fees.module.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/fees/fees.module.ts) |

---

## 3. Database Models & Storage

### PostgreSQL (`FeeStructure`, `FeeChallan`, `FeePayment`)
- **`FeeStructure`**:
  - `id`: UUID (Primary Key)
  - `name`: e.g. "Grade 10 Standard Fee 2026"
  - `amount`: Float
  - `frequency`: `MONTHLY`, `QUARTERLY`, `ANNUAL`
  - `classId`, `schoolId`
- **`FeeChallan`**:
  - `id`: UUID (Primary Key)
  - `challanNo`: Unique index (e.g. `CHL-2026-00452`)
  - `studentId`, `amount`, `discountAmount`, `customNotes`, `dueDate`, `fineAmount`
  - `status`: `UNPAID`, `PARTIAL`, `PAID`, `OVERDUE`
- **`FeePayment`**:
  - `id`: UUID (Primary Key)
  - `challanId`, `amountPaid`, `paymentMethod` (`CASH`, `BANK_TRANSFER`, `ONLINE`), `transactionRef`

### MongoDB
- **`AuditLog`**: Logs manual fee waivers, discount overrides, scholarship approvals, and payment status transactions.

---

## 4. API Endpoints

| Method | Endpoint | Access Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/fees/structures` | `SUPER_ADMIN`, `ADMIN` | List fee schedules by class |
| `POST` | `/api/fees/structures` | `SUPER_ADMIN`, `ADMIN` | Define new fee structure |
| `GET` | `/api/fees/challans` | `SUPER_ADMIN`, `ADMIN` | Query challans by status, class, and due month |
| `POST` | `/api/fees/generate-monthly` | `SUPER_ADMIN`, `ADMIN` | Batch generate class-wide monthly challans with automatic scholarship/discount deductions |
| `POST` | `/api/fees/create-challan` | `SUPER_ADMIN`, `ADMIN` | Create custom individual student fee challan |
| `POST` | `/api/fees/set-discount` | `SUPER_ADMIN`, `ADMIN` | Configure student-specific scholarship discount %, custom monthly fee override, and reason |
| `POST` | `/api/fees/pay` | `SUPER_ADMIN`, `ADMIN` | Record fee collection transaction and generate receipt |
| `GET` | `/api/fees/student/:studentId` | `SUPER_ADMIN`, `ADMIN`, `STUDENT`, `PARENT` | Retrieve student ledger and unpaid challans |
