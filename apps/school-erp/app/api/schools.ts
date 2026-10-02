import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint references for the Schools / tenant domain. */
export const schoolsApi = {
  getActive: api.schools.getActiveSchool,
  getById: api.schools.getSchool,
  list: api.schools.listSchools,
  updateBranding: api.schools.updateBranding,
  updateSmtp: api.schools.updateSmtp,
};

/** NestJS REST API endpoints for Schools */
export const schoolsRestApi = {
  getByCode: (code: string) =>
    apiClient.get<any>(`schools/by-code/${code}`),
  getCurrent: () =>
    apiClient.get<any>('schools/current'),
  getById: (id: string) =>
    apiClient.get<any>(`schools/${id}`),
  updateCurrent: (data: any) =>
    apiClient.patch<any>('schools/current', data),
  updateSmtp: (data: any) =>
    apiClient.patch<any>('schools/current/smtp', data),
};
