"use client";

import { MyAttendanceView } from "@/modules/attendance/MyAttendanceView";

export default function ParentAttendancePage() {
  return (
    <MyAttendanceView
      title="Child's Attendance"
      subtitle="Your child's day-by-day attendance, uploaded by teachers."
    />
  );
}
