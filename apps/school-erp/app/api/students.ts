import { api } from "@/convex/_generated/api";

/**
 * Convex endpoint references for the Students domain.
 * Hooks pass these to `useQuery` / `useMutation` (client-side reactive data).
 */
export const studentsApi = {
  list: api.students.listStudents,
  get: api.students.getStudent,
  create: api.students.createStudent,
  update: api.students.updateStudent,
  updateStatus: api.students.updateStudentStatus,
  nextAdmissionNumber: api.students.nextAdmissionNumber,
};
