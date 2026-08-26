"use client";

import { CalendarDays } from "lucide-react";
import { PortalPlaceholder } from "@/components/layout/PortalPlaceholder";

export default function ParentTimetablePage() {
  return (
    <PortalPlaceholder
      icon={CalendarDays}
      title="Child's Timetable"
      description="Your child's weekly class schedule by day and period."
      points={[
        "Day × period grid of subjects and teachers",
        "Auto-updated when the admin edits the section's timetable",
      ]}
    />
  );
}
