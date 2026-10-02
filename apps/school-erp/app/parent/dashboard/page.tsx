"use client";

import { Award, CalendarCheck, CalendarDays, Wallet } from "lucide-react";
import { RoleWelcome } from "@/components/layout/RoleWelcome";

export default function ParentDashboardPage() {
  return (
    <RoleWelcome
      greeting="Welcome"
      blurb="Stay on top of your child's academics, attendance and fees."
      tiles={[
        {
          href: "/parent/results",
          icon: Award,
          title: "Child's Results",
          desc: "Marks and grades across all subjects and exams.",
        },
        {
          href: "/parent/attendance",
          icon: CalendarCheck,
          title: "Child's Attendance",
          desc: "Attendance record uploaded by teachers over the term.",
        },
        {
          href: "/parent/timetable",
          icon: CalendarDays,
          title: "Child's Timetable",
          desc: "Your child's weekly class schedule.",
        },
        {
          href: "/parent/fees",
          icon: Wallet,
          title: "Fees",
          desc: "Fee status, installments, due dates and challans.",
        },
      ]}
    />
  );
}
