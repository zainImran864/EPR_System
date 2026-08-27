import { api } from "@/convex/_generated/api";

/** Convex endpoint references for custom database-backed auth. */
export const authApi = {
  register: api.auth.register,
  login: api.auth.login,
  logout: api.auth.logout,
  currentUser: api.auth.currentUser,
  verifyLoginTwoFactor: api.auth.verifyLoginTwoFactor,
};
