"use client";

import React from "react";
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Award,
  ArrowUpRight,
  Plus,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { StatCard, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";

export interface DashboardOverviewProps {
  onNavigate: (module: string) => void;
  onOpenAddStudent?: () => void;
  studentCount?: number;
  teacherCount?: number;
  classCount?: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onOpenAddStudent,
  studentCount = 184,
  teacherCount = 18,
  classCount = 12,
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D9488] to-[#115E59] p-6 sm:p-8 text-white shadow-lg shadow-teal-900/10">
        <div className="relative z-10 max-w-2xl">
          <Badge
            variant="primary"
            size="sm"
            className="bg-teal-800/80 text-teal-100 border-teal-600/50 mb-3"
          >
            Academic Session 2026-2027
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Oakridge International Academy
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-teal-100 max-w-lg leading-relaxed">
            Manage student enrollments, track daily attendance, record examination scores, and manage class assignments across your institution.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenAddStudent}
              leftIcon={<Plus className="w-4 h-4 text-[#0D9488]" />}
              className="bg-white text-[#0F766E] hover:bg-slate-50 border-none font-semibold shadow-xs"
            >
              Enroll New Student
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("attendance")}
              leftIcon={<CalendarCheck className="w-4 h-4" />}
              className="border-teal-400/40 text-white hover:bg-teal-700/50 bg-transparent font-medium"
            >
              Record Attendance
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("marks")}
              leftIcon={<Award className="w-4 h-4" />}
              className="text-teal-100 hover:bg-teal-700/50 hover:text-white"
            >
              Enter Marks
            </Button>
          </div>
        </div>

        {/* Decorative circle shapes */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-16 right-24 w-48 h-48 rounded-full bg-teal-400/10 pointer-events-none" />
      </div>

      {/* KPI Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Students"
          value={studentCount}
          subtitle="Enrolled this term"
          trend={{ value: "+8.4%", isPositive: true }}
          icon={<GraduationCap className="w-5 h-5" />}
        />
        <StatCard
          title="Teaching Staff"
          value={teacherCount}
          subtitle="Across 6 departments"
          trend={{ value: "+2 new", isPositive: true }}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Today's Attendance"
          value="96.2%"
          subtitle="177 of 184 Present"
          trend={{ value: "+1.8%", isPositive: true }}
          icon={<CalendarCheck className="w-5 h-5" />}
        />
        <StatCard
          title="Average Exam Score"
          value="88.4"
          subtitle="Mid-Term Exams"
          trend={{ value: "+3.2 pts", isPositive: true }}
          icon={<Award className="w-5 h-5" />}
        />
      </div>

      {/* Two-Column Grid: Quick Actions & Recent Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Students */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Student Admissions</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest registered students across active grades
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("students")}
                rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                className="text-xs text-[#0D9488] hover:bg-teal-50"
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="border-none shadow-none rounded-none">
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Guardian Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      name: "Aiden Clark",
                      roll: "10-A-01",
                      class: "Grade 10 - Sec A",
                      guardian: "David Clark (+1 555-444-1101)",
                      status: "active",
                    },
                    {
                      name: "Sophia Martinez",
                      roll: "10-A-02",
                      class: "Grade 10 - Sec A",
                      guardian: "Elena Martinez (+1 555-444-1102)",
                      status: "active",
                    },
                    {
                      name: "Ethan Wright",
                      roll: "10-A-03",
                      class: "Grade 10 - Sec A",
                      guardian: "Robert Wright (+1 555-444-1103)",
                      status: "active",
                    },
                    {
                      name: "Liam Chen",
                      roll: "10-A-04",
                      class: "Grade 10 - Sec A",
                      guardian: "Hui Chen (+1 555-444-1104)",
                      status: "active",
                    },
                    {
                      name: "Emma Davis",
                      roll: "10-A-05",
                      class: "Grade 10 - Sec A",
                      guardian: "Karen Davis (+1 555-444-1105)",
                      status: "active",
                    },
                  ].map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={s.name} size="xs" />
                          <span className="font-semibold text-slate-800">
                            {s.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral" size="sm" isMono>
                          {s.roll}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs">
                        {s.class}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {s.guardian}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" size="sm" dot>
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Today's Status & Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Pulse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      Section 10-A Synced
                    </div>
                    <div className="text-[11px] text-slate-500">
                      All 5 students recorded
                    </div>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  100%
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Present</span>
                  <span className="font-semibold font-mono-data text-emerald-600">
                    4 Students (80%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[80%]" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Late Arrivals</span>
                  <span className="font-semibold font-mono-data text-amber-600">
                    1 Student (20%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[20%]" />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => onNavigate("attendance")}
                className="mt-2 text-xs"
              >
                Open Full Attendance Grid
              </Button>
            </CardContent>
          </Card>

          {/* School System Info */}
          <Card variant="subtle">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#CCFBF1] text-[#0D9488] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-800">
                  Convex Reactive Sync Active
                </div>
                <div className="text-[11px] text-slate-500">
                  Multi-tenant cloud backend connected
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
