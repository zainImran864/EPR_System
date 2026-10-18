# Module 12: Finance, Expense Management & Multi-Currency Tracking

## 1. Overview
The **Finance & Accounts Module** empowers school leadership with end-to-end operational accounting, expense recording across utility bills, staff payroll, and supplies, Month-over-Month (MoM) expense comparison analytics, global school currency settings, positive amount validation, overdue late fee policy enforcement, and white-label printable financial statements.

---

## 2. File & Component Architecture

### Frontend Layer
| Purpose | File Path |
| :--- | :--- |
| **Manage Expenses Page** | [`apps/school-erp/app/admin/expenses/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/admin/expenses/page.tsx) |
| **Track & Compare Expenses Page** | [`apps/school-erp/app/admin/expenses/track/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/admin/expenses/track/page.tsx) |
| **Manage Expenses Component** | [`apps/school-erp/modules/expenses/ManageExpensesView.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/expenses/ManageExpensesView.tsx) |
| **Track Expenses Component** | [`apps/school-erp/modules/expenses/TrackExpensesView.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/modules/expenses/TrackExpensesView.tsx) |
| **Printable Financial Statement** | [`apps/school-erp/app/print/financial-report/page.tsx`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/print/financial-report/page.tsx) |
| **Printable MoM Comparison** | [`apps/school-erp/app/print/expense-comparison/page.tsx`](file:///mnt/drive4/School_erp_system/apps/school-erp/app/print/expense-comparison/page.tsx) |
| **Global Currency Hook & Store** | [`apps/school-erp/app/hooks/useCurrency.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/hooks/useCurrency.ts) & [`useCurrencyStore.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/stores/useCurrencyStore.ts) |
| **Client REST API Connector** | [`apps/school-erp/app/api/client.ts` -> `expensesRestApi`](file:///mnt/drive4/School_epr_system/apps/school-erp/app/api/client.ts) |

### Backend Layer
| Purpose | File Path |
| :--- | :--- |
| **Expenses Controller** | [`apps/school-erp-backend/src/modules/expenses/expenses.controller.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/expenses/expenses.controller.ts) |
| **Expenses Service** | [`apps/school-erp-backend/src/modules/expenses/expenses.service.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/expenses/expenses.service.ts) |
| **DTOs & Positive Validations** | [`apps/school-erp-backend/src/modules/expenses/dto/create-expense.dto.ts`](file:///mnt/drive4/School_epr_system/apps/school-erp-backend/src/modules/expenses/dto/create-expense.dto.ts) |
| **Module Definition** | [`apps/school-erp-backend/src/modules/expenses/expenses.module.ts`](file:///mnt/drive4/School_erp_system/apps/school-erp-backend/src/modules/expenses/expenses.module.ts) |

---

## 3. Key Capabilities & Logic

### 1. Strictly Positive Financial Inputs
- Every financial DTO (`CreateExpenseDto`, `CreateFeeChallanDto`, `UpdateFeePolicyDto`) enforces `@Min(0.01)` using `class-validator`.
- Negative numbers (`-100`) or zero are rejected at both frontend HTML input level (`min="0.01" step="0.01"`) and backend API validation pipes.

### 2. Multi-Currency Customization (`$`, `Rs / PKR`, `€`, `£`, `₹`, etc.)
- Admins configure the school currency symbol in `/admin/settings`.
- Stored as `currencySymbol` on the `School` PostgreSQL model.
- Automatically reflected across all views via `useCurrency()`:
  - Fee structures and fee challans
  - Parent/Student fee cards & balance counters
  - Expense records and tracking dashboards
  - Print reports (`/print/financial-report`, `/print/fee-challan`, `/print/expense-comparison`)

### 3. Expense Categorization & Tracking
- **Expense Categories**: `UTILITY_BILL`, `TEACHER_SALARY`, `STAFF_SALARY`, `PAPER_STATIONERY`, `MAINTENANCE`, `RENT`, `EVENT`, `OTHER`.
- Automatically aggregates total fee revenues versus total operating expenditures to compute **Net Net Profit / Loss** for any month, custom date range, or fiscal year.

### 4. Month-over-Month (MoM) Comparison Analytics
- Compares expenses of the selected month against the previous month.
- Calculates variance amounts and percentage change indicators (e.g., `+12.4%` increase or `-5.2%` savings).
- Visualized in interactive comparison charts and printable PDF-ready layouts.

### 5. Overdue Late Fee Increment Policy
- Admins configure a default late fee increment amount (e.g., `+Rs. 500` or `+$25`) when a fee bill exceeds its due date.
- Upon passing the due date, unpaid fee challans automatically transition to `OVERDUE`, applying the increment.
- Fee cards and printable 3-copy challans clearly print:
  - *Within Due Date Payable Amount*
  - *Late Fee Increment (After Due Date)*
  - *Total Payable After Due Date*
- Real-time notification dispatched to both School Admin and Student/Parent.

### 6. White-Label Printable Financial Reports
- Single-page formatted print views (`/print/financial-report`, `/print/expense-comparison`).
- Dynamically loads school logo and school name in header.
- Zero third-party branding watermarks.
