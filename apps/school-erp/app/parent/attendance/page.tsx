"use client";

import { CalendarCheck } from "lucide-react";
import { PortalPlaceholder } from "@/components/layout/PortalPlaceholder";

export default function ParentAttendancePage() {
  return (
    <PortalPlaceholder
      icon={CalendarCheck}
      title="Child's Attendance"
      description="Your child's day-by-day attendance, uploaded by teachers and visible here in real time."
      points={[
        "Present / absent / late record per day and per lecture",
        "Overall attendance rate for the term",
      ]}
    />
  );
}
