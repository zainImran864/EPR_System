import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint references for custom database-backed auth. */
export const authApi = {
  register: api.auth.register,
  login: api.auth.login,
  logout: api.auth.logout,
  currentUser: api.auth.currentUser,
  verifyLoginTwoFactor: api.auth.verifyLoginTwoFactor,
};

/** NestJS REST API endpoints for Auth */
export const authRestApi = {
  login: (data: { email: string; password: string; twoFactorCode?: string }) =>
    apiClient.post<any>('auth/login', data),
  logout: () =>
    apiClient.post<{ success: boolean; message: string }>('auth/logout'),
  registerSchool: (data: any) =>
    apiClient.post<any>('auth/register-school', data),
  getProfile: () =>
    apiClient.get<any>('auth/me'),
  changePassword: (data: any) =>
    apiClient.post<any>('auth/change-password', data),
  updateTheme: (themeColor: string) =>
    apiClient.patch<any>('auth/theme', { themeColor }),
};
