import { apiClient } from "./client";

/** NestJS REST API endpoints for Account */
export const accountRestApi = {
  updateProfile: (data: any) =>
    apiClient.patch<any>('users/profile', data),
  updateTheme: (themeColor: string) =>
    apiClient.patch<any>('auth/theme', { themeColor }),
  changePassword: (data: any) =>
    apiClient.post<any>('auth/change-password', data),
};
