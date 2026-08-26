"use client";

import { CalendarCheck } from "lucide-react";
import { PortalPlaceholder } from "@/components/layout/PortalPlaceholder";

export default function StudentAttendancePage() {
  return (
    <PortalPlaceholder
      icon={CalendarCheck}
      title="My Attendance"
      description="Your day-by-day attendance, uploaded by your teachers and visible here in real time."
      points={[
        "Present / absent / late record per day and per lecture",
        "Overall attendance rate for the term",
        "Same record your parents and school admin see",
      ]}
    />
  );
}
