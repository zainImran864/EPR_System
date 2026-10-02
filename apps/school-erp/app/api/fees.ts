import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint references for the Fees domain. */
export const feesApi = {
  generate: api.fees.generateBills,
  list: api.fees.listBills,
  getStudentBills: api.fees.getStudentBills,
  recordPayment: api.fees.recordPayment,
  getChallan: api.fees.getChallan,
  getSectionChallans: api.fees.getSectionChallans,
};

/** NestJS REST API endpoints for Fees */
export const feesRestApi = {
  listChallans: (params?: any) =>
    apiClient.get<any[]>('fees/challans', params),
  getChallan: (id: string) =>
    apiClient.get<any>(`fees/challans/${id}`),
  createChallan: (data: any) =>
    apiClient.post<any>('fees/challans', data),
  generateBulk: (data: any) =>
    apiClient.post<any>('fees/challans/bulk', data),
  recordPayment: (id: string, data: any) =>
    apiClient.post<any>(`fees/challans/${id}/pay`, data),
};
