"use client";

import { MyAttendanceView } from "@/modules/attendance/MyAttendanceView";

export default function StudentAttendancePage() {
  return (
    <MyAttendanceView
      title="My Attendance"
      subtitle="Your day-by-day attendance record, uploaded by your teachers."
    />
  );
}
