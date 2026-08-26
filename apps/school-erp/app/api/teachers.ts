import { api } from "@/convex/_generated/api";

/** Convex endpoint references for the Teachers domain. */
export const teachersApi = {
  list: api.teachers.listTeachers,
  create: api.teachers.createTeacher,
  updateStatus: api.teachers.updateTeacherStatus,
};
