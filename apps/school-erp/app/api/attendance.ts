import { api } from "@/convex/_generated/api";

/** Convex endpoint references for the Attendance domain. */
export const attendanceApi = {
  sectionRoster: api.attendance.getSectionRoster,
  save: api.attendance.saveAttendance,
  summary: api.attendance.getAttendanceSummary,
  studentAttendance: api.attendance.getStudentAttendance,
  sectionOverview: api.attendance.getSectionAttendanceOverview,
};
