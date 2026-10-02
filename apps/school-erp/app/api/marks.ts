import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint references for the Exams, Subjects & Marks domain. */
export const marksApi = {
  listExams: api.marks.listExams,
  createExam: api.marks.createExam,
  listSubjects: api.marks.listSubjects,
  matrix: api.marks.getMarksMatrix,
  save: api.marks.saveMarks,
};

/** NestJS REST API endpoints for Marks */
export const marksRestApi = {
  listExamTerms: () =>
    apiClient.get<any[]>('marks/exam-terms'),
  createExamTerm: (data: any) =>
    apiClient.post<any>('marks/exam-terms', data),
  getSectionMarks: (sectionId: string, examTermId: string, subjectId: string) =>
    apiClient.get<any[]>('marks/section-marks', { sectionId, examTermId, subjectId }),
  saveMarks: (data: any) =>
    apiClient.post<any>('marks/save', data),
  getReportCard: (studentId: string, examTermId: string) =>
    apiClient.get<any>(`marks/report-card/${studentId}`, { examTermId }),
};
