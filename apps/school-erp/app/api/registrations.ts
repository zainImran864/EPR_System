import { api } from "@/convex/_generated/api";

/** Convex endpoint references for the school registration approval queue. */
export const registrationsApi = {
  list: api.registrations.listRequests,
  approve: api.registrations.approveRequest,
  reject: api.registrations.rejectRequest,
};

/** Super-admin / platform endpoints. */
export const superAdminApi = {
  seed: api.superadmin.seedSuperAdmin,
  stats: api.superadmin.platformStats,
};
