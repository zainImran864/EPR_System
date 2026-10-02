import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint references for the Teachers domain. */
export const teachersApi = {
  list: api.teachers.listTeachers,
  create: api.teachers.createTeacher,
  update: api.teachers.updateTeacher,
  updateStatus: api.teachers.updateTeacherStatus,
  remove: api.teachers.deleteTeacher,
  nextEmployeeId: api.teachers.nextEmployeeId,
};

/** NestJS REST API endpoints for Teachers */
export const teachersRestApi = {
  list: (search?: string) =>
    apiClient.get<any[]>('teachers', { search }),
  get: (id: string) =>
    apiClient.get<any>(`teachers/${id}`),
  create: (data: any) =>
    apiClient.post<any>('teachers', data),
  update: (id: string, data: any) =>
    apiClient.patch<any>(`teachers/${id}`, data),
  remove: (id: string) =>
    apiClient.delete<any>(`teachers/${id}`),
};
