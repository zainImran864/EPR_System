import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint references for the Students domain. */
export const studentsApi = {
  list: api.students.listStudents,
  get: api.students.getStudent,
  create: api.students.createStudent,
  update: api.students.updateStudent,
  updateStatus: api.students.updateStudentStatus,
  remove: api.students.deleteStudent,
  nextAdmissionNumber: api.students.nextAdmissionNumber,
};

/** NestJS REST API endpoints for Students */
export const studentsRestApi = {
  list: (params?: any) =>
    apiClient.get<any[]>('students', params),
  get: (id: string) =>
    apiClient.get<any>(`students/${id}`),
  create: (data: any) =>
    apiClient.post<any>('students', data),
  update: (id: string, data: any) =>
    apiClient.patch<any>(`students/${id}`, data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch<any>(`students/${id}/status`, { status }),
  remove: (id: string) =>
    apiClient.delete<any>(`students/${id}`),
  nextAdmissionNumber: () =>
    apiClient.get<{ admissionNumber: string }>('students/next-admission-number'),
};
