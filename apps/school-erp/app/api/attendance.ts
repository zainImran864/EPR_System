import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

/** Convex endpoint references for the Attendance domain. */
export const attendanceApi = {
  sectionRoster: api.attendance.getSectionRoster,
  save: api.attendance.saveAttendance,
  summary: api.attendance.getAttendanceSummary,
  studentAttendance: api.attendance.getStudentAttendance,
  sectionOverview: api.attendance.getSectionAttendanceOverview,
};

/** NestJS REST API endpoints for Attendance */
export const attendanceRestApi = {
  getSection: (sectionId: string, date?: string) =>
    apiClient.get<any[]>(`attendance/section/${sectionId}`, { date }),
  markAttendance: (data: any) =>
    apiClient.post<any>('attendance/mark', data),
  getStudentAttendance: (studentId: string, month?: string) =>
    apiClient.get<any>(`attendance/student/${studentId}`, { month }),
};
