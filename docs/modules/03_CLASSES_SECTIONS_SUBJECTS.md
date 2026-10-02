# Module 03: Classes, Sections & Subjects

## 1. Feature Description & Capabilities
- **Academic Taxonomy:** Multi-level structure of Grade Classes (1-12) and Class Sections (e.g. A, B, Rose).
- **Class Section Controls:** Configure physical room numbers, maximum student capacities, and student enrollment counts.
- **Subject Directory:** Manage academic subjects (e.g., Mathematics, Physics, English) tied to classes or school-wide.

---

## 2. Backend Files & Implementation
- **Module:** [`apps/school-erp-backend/src/modules/classes/classes.module.ts`](../../apps/school-erp-backend/src/modules/classes/classes.module.ts)
- **Controller:** [`apps/school-erp-backend/src/modules/classes/classes.controller.ts`](../../apps/school-erp-backend/src/modules/classes/classes.controller.ts)
- **Service:** [`apps/school-erp-backend/src/modules/classes/classes.service.ts`](../../apps/school-erp-backend/src/modules/classes/classes.service.ts)
- **DTOs:** [`apps/school-erp-backend/src/modules/classes/dto/class.dto.ts`](../../apps/school-erp-backend/src/modules/classes/dto/class.dto.ts) (`CreateClassDto`, `CreateSectionDto`, `CreateSubjectDto`)
- **Database Models (Prisma):** `model Class`, `model Section`, `model Subject`

### Key Endpoints:
- `GET /api/classes`: List all classes with sections, subjects, and student counts.
- `POST /api/classes`: Create a new academic class grade.
- `POST /api/classes/sections`: Add a new section to a class with room and capacity.
- `DELETE /api/classes/sections/:id`: Remove an empty section.
- `GET /api/classes/subjects`: List academic subjects.
- `POST /api/classes/subjects`: Register a new subject.

---

## 3. Frontend Files & Implementation
- **API Client:** [`apps/school-erp/app/api/classes.ts`](../../apps/school-erp/app/api/classes.ts) (`classesRestApi`)
- **Classes Management Page:** [`apps/school-erp/app/admin/classes/page.tsx`](../../apps/school-erp/app/admin/classes/page.tsx)
- **Class Card UI Component:** [`apps/school-erp/modules/classes/ClassCard.tsx`](../../apps/school-erp/modules/classes/ClassCard.tsx)
- **Add Class/Section Modal:** [`apps/school-erp/modules/classes/AddClassModal.tsx`](../../apps/school-erp/modules/classes/AddClassModal.tsx)
- **Hooks & Store:** [`apps/school-erp/app/hooks/useClasses.ts`](../../apps/school-erp/app/hooks/useClasses.ts), [`apps/school-erp/app/store/useClassesStore.ts`](../../apps/school-erp/app/store/useClassesStore.ts)
