"use client";

import { CalendarDays, Award, ClipboardCheck } from "lucide-react";
import { RoleWelcome } from "@/components/layout/RoleWelcome";

export default function TeacherDashboardPage() {
  return (
    <RoleWelcome
      greeting="Welcome"
      blurb="Your classes, timetable, marks and attendance tools live here."
      tiles={[
        {
          href: "/teacher/marks",
          icon: Award,
          title: "Marks Upload",
          desc: "Enter marks per class, section & subject with automatic grading.",
        },
        {
          href: "/teacher/attendance",
          icon: ClipboardCheck,
          title: "Attendance",
          desc: "Mark per-lecture attendance for your classes.",
        },
        {
          href: "/teacher/timetable",
          icon: CalendarDays,
          title: "My Timetable",
          desc: "Your weekly lecture schedule, auto-built from the school timetable.",
        },
      ]}
    />
  );
}
