import { api } from "@/convex/_generated/api";

/** Convex endpoint references for the Schools / tenant domain. */
export const schoolsApi = {
  getActive: api.schools.getActiveSchool,
  list: api.schools.listSchools,
  updateBranding: api.schools.updateBranding,
};
