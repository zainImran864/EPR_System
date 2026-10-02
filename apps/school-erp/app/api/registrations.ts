import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint references for the school registration approval queue. */
export const registrationsApi = {
  list: api.registrations.listRequests,
  approve: api.registrations.approveRequest,
  reject: api.registrations.rejectRequest,
  listChangeRequests: api.registrations.listSchoolChangeRequests,
  resolveChangeRequest: api.registrations.resolveSchoolChangeRequest,
};

/** Super-admin / platform endpoints. */
export const superAdminApi = {
  seed: api.superadmin.seedSuperAdmin,
  stats: api.superadmin.platformStats,
};

/** NestJS REST API endpoints for Registrations & Superadmin */
export const superAdminRestApi = {
  listAllSchools: () =>
    apiClient.get<any[]>('schools/superadmin/all'),
  listPendingRequests: () =>
    apiClient.get<any[]>('schools/superadmin/pending-requests'),
  approveRequest: (id: string) =>
    apiClient.post<any>(`schools/superadmin/requests/${id}/approve`),
  rejectRequest: (id: string, reason?: string) =>
    apiClient.post<any>(`schools/superadmin/requests/${id}/reject`, { reason }),
  getStats: () =>
    apiClient.get<any>('dashboard/superadmin'),
};
