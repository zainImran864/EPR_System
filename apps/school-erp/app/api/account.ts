import { api } from "@/convex/_generated/api";

/** Convex endpoint references for the per-user Account/Settings domain. */
export const accountApi = {
  updateProfile: api.account.updateProfile,
  changePassword: api.account.changePassword,
  setTwoFactor: api.account.setTwoFactor,
  setNotifications: api.account.setNotifications,
  generateUploadUrl: api.account.generateUploadUrl,
  setAvatar: api.account.setAvatar,
  setSchoolLogo: api.account.setSchoolLogo,
  requestSchoolNameChange: api.account.requestSchoolNameChange,
};
