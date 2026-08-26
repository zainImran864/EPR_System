import { api } from "@/convex/_generated/api";

/** Convex endpoint references for the Schools / tenant domain. */
export const schoolsApi = {
  getActive: api.schools.getActiveSchool,
  getById: api.schools.getSchool,
  list: api.schools.listSchools,
  updateBranding: api.schools.updateBranding,
};
