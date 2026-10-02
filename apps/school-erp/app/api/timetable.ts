import { api } from "@/convex/_generated/api";
import { apiClient } from "./client";

export const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export const PERIODS = [
  { period: 1, startTime: "08:00", endTime: "08:45" },
  { period: 2, startTime: "08:45", endTime: "09:30" },
  { period: 3, startTime: "09:30", endTime: "10:15" },
  { period: 4, startTime: "10:30", endTime: "11:15" },
  { period: 5, startTime: "11:15", endTime: "12:00" },
  { period: 6, startTime: "12:00", endTime: "12:45" },
  { period: 7, startTime: "13:30", endTime: "14:15" },
  { period: 8, startTime: "14:15", endTime: "15:00" },
];

/** Convex endpoint references for the Timetable domain. */
export const timetableApi = {
  getSection: api.timetable.getSectionTimetable,
  getTeacher: api.timetable.getTeacherTimetable,
  setSlot: api.timetable.setSlot,
  deleteSlot: api.timetable.deleteSlot,
};

/** NestJS REST API endpoints for Timetable */
export const timetableRestApi = {
  getSection: (sectionId: string) =>
    apiClient.get<any[]>(`timetable/section/${sectionId}`),
  getTeacher: (teacherId: string) =>
    apiClient.get<any[]>(`timetable/teacher/${teacherId}`),
  setSlot: (data: any) =>
    apiClient.post<any>('timetable/entry', data),
  deleteSlot: (id: string) =>
    apiClient.delete<any>(`timetable/entry/${id}`),
};
