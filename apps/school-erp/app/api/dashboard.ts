import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint references for aggregated dashboard statistics. */
export const dashboardApi = {
  stats: api.dashboard.getStats,
};

/** NestJS REST API endpoints for Dashboard */
export const dashboardRestApi = {
  getAdminStats: () =>
    apiClient.get<any>('dashboard/admin'),
  getTeacherDashboard: () =>
    apiClient.get<any>('dashboard/teacher'),
  getStudentDashboard: () =>
    apiClient.get<any>('dashboard/student'),
  getSuperAdminStats: () =>
    apiClient.get<any>('dashboard/superadmin'),
};
