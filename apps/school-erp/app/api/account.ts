import { api } from "@/convex/_generated/api";

/** Convex endpoint references for the per-user Account/Settings domain. */
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
