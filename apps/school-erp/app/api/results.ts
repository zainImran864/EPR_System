import { marksRestApi } from "./client";

export const resultsRestApi = {
  getStudentResults: (studentId: string) => marksRestApi.getStudentReportCard(studentId),
  getReportCard: (studentId: string, examTermId?: string) =>
    marksRestApi.getStudentReportCard(studentId, examTermId),
};
