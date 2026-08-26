import { api } from "@/convex/_generated/api";

/** Convex endpoint references for the Exams, Subjects & Marks domain. */
export const marksApi = {
  listExams: api.marks.listExams,
  createExam: api.marks.createExam,
  listSubjects: api.marks.listSubjects,
  matrix: api.marks.getMarksMatrix,
  save: api.marks.saveMarks,
};
