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
  MessageCircle,
  MapPin,
  Receipt,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  group?: string;
  description?: string;
}

const ico = (I: React.ElementType) => <I className="w-4 h-4" />;

export const ADMIN_NAV: NavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: ico(LayoutDashboard), group: "Overview", description: "Institution KPIs, grade charts & recent admissions" },
  { href: "/admin/students", label: "Students", icon: ico(GraduationCap), group: "Academics", description: "Student directory, enrollment & progression engine" },
  { href: "/admin/classes", label: "Classes & Sections", icon: ico(BookOpen), group: "Academics", description: "Grade levels, sections, rooms & class teachers" },
  { href: "/admin/teachers", label: "Faculty & Staff", icon: ico(Users), group: "Academics", description: "Teacher profiles, specializations & subject assignments" },
  { href: "/admin/timetable", label: "Timetable", icon: ico(CalendarDays), group: "Academics", description: "Weekly class schedules & period builder" },
  { href: "/admin/attendance", label: "Student Attendance", icon: ico(CalendarCheck), group: "Operations", description: "Daily student attendance roster & analytics" },
  { href: "/admin/teacher-attendance", label: "Teacher Attendance", icon: ico(MapPin), group: "Operations", description: "Live GPS & photo teacher attendance + leave approvals" },
  { href: "/admin/marks", label: "Marks & Exams", icon: ico(Award), group: "Operations", description: "Exam schedules, question papers & mark entry" },
  { href: "/admin/fees", label: "Fees & Challans", icon: ico(Wallet), group: "Finance & Accounts", description: "Fee billing, discounts, payments & printable challans" },
  { href: "/admin/expenses", label: "Expenses & P&L", icon: ico(Receipt), group: "Finance & Accounts", description: "Manage monthly expenses, utility bills, salaries & track profit/loss" },
  { href: "/admin/whatsapp", label: "WhatsApp Center", icon: ico(MessageCircle), group: "Communication", description: "Automated & manual parent WhatsApp broadcasts" },
  { href: "/admin/notifications", label: "In-App Alerts", icon: ico(Bell), group: "Communication", description: "Institution announcements & portal notifications" },
  { href: "/admin/settings", label: "School Settings", icon: ico(Settings), group: "System", description: "School branding, SMTP, KYC & security preferences" },
];

export const TEACHER_NAV: NavLink[] = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: ico(LayoutDashboard), group: "Overview", description: "Teaching overview & quick actions" },
  { href: "/teacher/my-attendance", label: "My Attendance & Leave", icon: ico(MapPin), group: "Operations", description: "Mark daily school attendance with photo & live GPS + apply leave" },
  { href: "/teacher/marks", label: "Marks Upload", icon: ico(Award), group: "Academics", description: "Enter & publish subject examination scores" },
  { href: "/teacher/attendance", label: "Class Attendance", icon: ico(CalendarCheck), group: "Academics", description: "Record daily class & section attendance" },
  { href: "/teacher/timetable", label: "Timetable", icon: ico(CalendarDays), group: "Academics", description: "View assigned teaching schedule" },
  { href: "/teacher/whatsapp", label: "WhatsApp Center", icon: ico(MessageCircle), group: "Communication", description: "Message parents & guardians" },
  { href: "/teacher/notifications", label: "Notifications", icon: ico(Bell), group: "Communication", description: "Leave updates and school notices" },
  { href: "/teacher/settings", label: "Settings", icon: ico(Settings), group: "System", description: "Account, theme & security settings" },
];

export const STUDENT_NAV: NavLink[] = [
  { href: "/student/dashboard", label: "Dashboard", icon: ico(LayoutDashboard), group: "Overview", description: "Student portal overview & shortcuts" },
  { href: "/student/results", label: "My Results", icon: ico(Award), group: "Academics", description: "Exam scores, grades & printable report card" },
  { href: "/student/attendance", label: "My Attendance", icon: ico(CalendarCheck), group: "Academics", description: "Daily attendance log & rate" },
  { href: "/student/timetable", label: "My Timetable", icon: ico(CalendarDays), group: "Academics", description: "Weekly class timetable" },
  { href: "/student/fees", label: "My Fees", icon: ico(Wallet), group: "Finance", description: "Fee vouchers, payment status & challans" },
  { href: "/student/notifications", label: "Notifications", icon: ico(Bell), group: "Communication", description: "School announcements & circulars" },
  { href: "/student/settings", label: "Settings", icon: ico(Settings), group: "System", description: "Profile, theme & security settings" },
];

export const PARENT_NAV: NavLink[] = [
  { href: "/parent/dashboard", label: "Dashboard", icon: ico(LayoutDashboard), group: "Overview", description: "Parent portal overview & child progress" },
  { href: "/parent/results", label: "Results", icon: ico(Award), group: "Academics", description: "Child exam marks & report cards" },
  { href: "/parent/attendance", label: "Attendance", icon: ico(CalendarCheck), group: "Academics", description: "Child attendance history & alerts" },
  { href: "/parent/timetable", label: "Timetable", icon: ico(CalendarDays), group: "Academics", description: "Weekly class schedule" },
  { href: "/parent/fees", label: "Fees", icon: ico(Wallet), group: "Finance", description: "Fee bills, payment status & challans" },
  { href: "/parent/notifications", label: "Notifications", icon: ico(Bell), group: "Communication", description: "Fee alerts & school circulars" },
  { href: "/parent/settings", label: "Settings", icon: ico(Settings), group: "System", description: "Account, theme & notification preferences" },
];

/** Resolve the page title from the current pathname against a nav list. */
export function navTitle(nav: NavLink[], pathname: string): string {
  const match = nav.find((n) => pathname.startsWith(n.href));
  if (match) return match.label;
  if (pathname.endsWith("/profile")) return "My Profile";
  if (pathname.endsWith("/audit-logs")) return "Audit Logs";
  if (pathname.endsWith("/settings")) return "Settings";
  return "Portal";
}

/** Resolve the current section group from the current pathname against a nav list. */
export function navGroup(nav: NavLink[], pathname: string): string | undefined {
  const match = nav.find((n) => pathname.startsWith(n.href));
  if (match?.group) return match.group;
  if (pathname.endsWith("/profile") || pathname.endsWith("/audit-logs") || pathname.endsWith("/settings")) {
    return "Account & System";
  }
  return undefined;
}

