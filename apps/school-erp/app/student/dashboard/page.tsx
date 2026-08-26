"use client";

import { Award, CalendarCheck, CalendarDays } from "lucide-react";
import { RoleWelcome } from "@/components/layout/RoleWelcome";

export default function StudentDashboardPage() {
  return (
    <RoleWelcome
      greeting="Hi"
      blurb="Track your results, attendance and timetable in one place."
      tiles={[
        {
          href: "/student/results",
          icon: Award,
          title: "My Results",
          desc: "Subject-wise marks, grades and overall performance per exam.",
        },
        {
          href: "/student/attendance",
          icon: CalendarCheck,
          title: "My Attendance",
          desc: "Your day-by-day attendance record and overall rate.",
        },
        {
          href: "/student/timetable",
          icon: CalendarDays,
          title: "My Timetable",
          desc: "Your weekly class schedule by day and period.",
        },
      ]}
    />
  );
}
