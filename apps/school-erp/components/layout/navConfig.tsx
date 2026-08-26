import React from "react";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  CalendarCheck,
  Award,
  Settings,
  CalendarDays,
  Wallet,
  Bell,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ico = (I: React.ElementType) => <I className="w-4 h-4" />;

export const ADMIN_NAV: NavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: ico(LayoutDashboard) },
  { href: "/admin/students", label: "Students", icon: ico(GraduationCap) },
  { href: "/admin/classes", label: "Classes & Sections", icon: ico(BookOpen) },
  { href: "/admin/teachers", label: "Faculty & Staff", icon: ico(Users) },
  { href: "/admin/timetable", label: "Timetable", icon: ico(CalendarDays) },
  { href: "/admin/attendance", label: "Attendance", icon: ico(CalendarCheck) },
  { href: "/admin/marks", label: "Marks & Exams", icon: ico(Award) },
  { href: "/admin/fees", label: "Fees & Challans", icon: ico(Wallet) },
  { href: "/admin/notifications", label: "Notifications", icon: ico(Bell) },
  { href: "/admin/settings", label: "School Settings", icon: ico(Settings) },
];

export const TEACHER_NAV: NavLink[] = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: ico(LayoutDashboard) },
  { href: "/teacher/marks", label: "Marks Upload", icon: ico(Award) },
  { href: "/teacher/attendance", label: "Attendance", icon: ico(CalendarCheck) },
  { href: "/teacher/timetable", label: "Timetable", icon: ico(CalendarDays) },
  { href: "/teacher/settings", label: "Settings", icon: ico(Settings) },
];

export const STUDENT_NAV: NavLink[] = [
  { href: "/student/dashboard", label: "Dashboard", icon: ico(LayoutDashboard) },
  { href: "/student/results", label: "My Results", icon: ico(Award) },
  { href: "/student/attendance", label: "My Attendance", icon: ico(CalendarCheck) },
  { href: "/student/timetable", label: "My Timetable", icon: ico(CalendarDays) },
  { href: "/student/fees", label: "My Fees", icon: ico(Wallet) },
  { href: "/student/settings", label: "Settings", icon: ico(Settings) },
];

export const PARENT_NAV: NavLink[] = [
  { href: "/parent/dashboard", label: "Dashboard", icon: ico(LayoutDashboard) },
  { href: "/parent/results", label: "Results", icon: ico(Award) },
  { href: "/parent/attendance", label: "Attendance", icon: ico(CalendarCheck) },
  { href: "/parent/timetable", label: "Timetable", icon: ico(CalendarDays) },
  { href: "/parent/fees", label: "Fees", icon: ico(Wallet) },
  { href: "/parent/settings", label: "Settings", icon: ico(Settings) },
];

/** Resolve the page title from the current pathname against a nav list. */
export function navTitle(nav: NavLink[], pathname: string): string {
  const match = nav.find((n) => pathname.startsWith(n.href));
  return match?.label ?? "Portal";
}
