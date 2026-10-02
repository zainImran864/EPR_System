import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint references for user account, profile, 2FA, and preferences. */
export const accountApi = {
  updateProfile: api.account.updateProfile,
  changePassword: api.account.changePassword,
  setNotifications: api.account.setNotifications,
  setThemeColor: api.account.setThemeColor,
  generateUploadUrl: api.account.generateUploadUrl,
  setAvatar: api.account.setAvatar,
  setSchoolLogo: api.account.setSchoolLogo,
  requestSchoolNameChange: api.account.requestSchoolNameChange,
  // Two-factor
  startTwoFactorSetup: api.account.startTwoFactorSetup,
  confirmTwoFactor: api.account.confirmTwoFactor,
  disableTwoFactor: api.account.disableTwoFactor,
  listTrustedDevices: api.account.listTrustedDevices,
  deleteTrustedDevice: api.account.deleteTrustedDevice,
};

/** NestJS REST API endpoints for Account */
export const accountRestApi = {
  updateProfile: (data: any) =>
    apiClient.patch<any>('users/profile', data),
  updateTheme: (themeColor: string) =>
    apiClient.patch<any>('auth/theme', { themeColor }),
  changePassword: (data: any) =>
    apiClient.post<any>('auth/change-password', data),
};
