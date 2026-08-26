"use client";

import { CalendarDays } from "lucide-react";
import { PortalPlaceholder } from "@/components/layout/PortalPlaceholder";

export default function TeacherTimetablePage() {
  return (
    <PortalPlaceholder
      icon={CalendarDays}
      title="My Timetable"
      description="Your weekly lecture schedule, auto-built from the school-wide timetable the admin configures."
      points={[
        "Day × period grid of the subjects and sections you teach",
        "Auto-populated from timetableSlots — no manual entry",
        "Highlights your class-in-charge periods",
      ]}
    />
  );
}
