import { api } from "@/convex/_generated/api";

/** Convex endpoint references for the Timetable domain. */
export const timetableApi = {
  getSection: api.timetable.getSectionTimetable,
  getTeacher: api.timetable.getTeacherTimetable,
  setSlot: api.timetable.setSlot,
  deleteSlot: api.timetable.deleteSlot,
};

export const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

/** Default period grid (period index → time range). */
export const PERIODS = [
  { period: 1, startTime: "08:00", endTime: "08:45" },
  { period: 2, startTime: "08:45", endTime: "09:30" },
  { period: 3, startTime: "09:30", endTime: "10:15" },
  { period: 4, startTime: "10:30", endTime: "11:15" },
  { period: 5, startTime: "11:15", endTime: "12:00" },
  { period: 6, startTime: "12:00", endTime: "12:45" },
  { period: 7, startTime: "13:15", endTime: "14:00" },
  { period: 8, startTime: "14:00", endTime: "14:45" },
];
