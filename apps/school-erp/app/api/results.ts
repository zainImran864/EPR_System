import { api } from "@/convex/_generated/api";

/** Convex endpoint references for Results / report cards. */
export const resultsApi = {
  listExams: api.results.listExams,
  getStudentResults: api.results.getStudentResults,
  getReportCard: api.results.getReportCard,
};
