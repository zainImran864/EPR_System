import { schoolsRestApi } from "./client";

export const emailRestApi = {
  testSmtp: (data: any) => schoolsRestApi.testSmtp(data),
};
