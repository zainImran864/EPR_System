"use client";

import { CalendarDays } from "lucide-react";
import { PortalPlaceholder } from "@/components/layout/PortalPlaceholder";

export default function StudentTimetablePage() {
  return (
    <PortalPlaceholder
      icon={CalendarDays}
      title="My Timetable"
      description="Your weekly class schedule by day and period, built from the school-wide timetable."
      points={[
        "Day × period grid of your subjects and teachers",
        "Auto-updated when the admin edits your section's timetable",
      ]}
    />
  );
}
