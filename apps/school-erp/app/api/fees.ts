import { api } from "@/convex/_generated/api";

/** Convex endpoint references for the Fees domain. */
export const feesApi = {
  generate: api.fees.generateBills,
  list: api.fees.listBills,
  getStudentBills: api.fees.getStudentBills,
  recordPayment: api.fees.recordPayment,
  getChallan: api.fees.getChallan,
  getSectionChallans: api.fees.getSectionChallans,
};
