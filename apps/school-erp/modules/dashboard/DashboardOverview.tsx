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
  BookOpen,
} from "lucide-react";
import { StatCard, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { DonutChart, BarChart, CHART_COLORS } from "@/components/charts";
import { useDashboard } from "@/app/hooks/useDashboard";
import { useActiveSchool } from "@/app/hooks/useActiveSchool";

export interface DashboardOverviewProps {
  onNavigate: (module: string) => void;
  onOpenAddStudent?: () => void;
}

const GRADE_ORDER = ["A+", "A", "B", "C", "D", "F"];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onOpenAddStudent,
}) => {
  const { school } = useActiveSchool();
  const today = new Date().toISOString().split("T")[0];
  const { stats, isLoading } = useDashboard(today);

  if (isLoading || !stats) {
    return <DashboardSkeleton />;
  }

  const genderData = [
    { name: "Male", value: stats.genderBreakdown.male, color: CHART_COLORS.sky },
    { name: "Female", value: stats.genderBreakdown.female, color: CHART_COLORS.rose },
    { name: "Other", value: stats.genderBreakdown.other, color: CHART_COLORS.violet },
  ].filter((d) => d.value > 0);

  const gradeData = GRADE_ORDER.filter(
    (g) => (stats.gradeDistribution[g] ?? 0) > 0
  ).map((g) => ({ grade: g, count: stats.gradeDistribution[g] ?? 0 }));

  const att = stats.attendanceByStatus;
  const attTotal = att.present + att.absent + att.late + att.excused;
  const attendanceData = [
    { name: "Present", value: att.present, color: CHART_COLORS.emerald },
    { name: "Late", value: att.late, color: CHART_COLORS.amber },
    { name: "Absent", value: att.absent, color: CHART_COLORS.rose },
    { name: "Excused", value: att.excused, color: CHART_COLORS.sky },
  ].filter((d) => d.value > 0);

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
            Academic Session {school?.activeYear ?? "2026-2027"}
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {school?.name ?? "Your Institution"}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-teal-100 max-w-lg leading-relaxed">
            Manage student enrollments, track daily attendance, record examination
            scores, and manage class assignments across your institution.
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

        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-16 right-24 w-48 h-48 rounded-full bg-teal-400/10 pointer-events-none" />
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Students"
          value={stats.studentCount}
          subtitle="Active enrollments"
          icon={<GraduationCap className="w-5 h-5" />}
        />
        <StatCard
          title="Teaching Staff"
          value={stats.teacherCount}
          subtitle="Active faculty"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Today's Attendance"
          value={
            stats.todayAttendanceRate !== null
              ? `${stats.todayAttendanceRate}%`
              : "—"
          }
          subtitle={
            stats.todayAttendanceRate !== null
              ? `${attTotal} students recorded`
              : "Not recorded yet"
          }
          icon={<CalendarCheck className="w-5 h-5" />}
        />
        <StatCard
          title="Average Exam Score"
          value={stats.avgExamScore !== null ? `${stats.avgExamScore}%` : "—"}
          subtitle={stats.avgExamScore !== null ? "Across published marks" : "No marks yet"}
          icon={<Award className="w-5 h-5" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {gradeData.length > 0 ? (
              <BarChart
                data={gradeData}
                xKey="grade"
                bars={[{ key: "count", name: "Students", color: CHART_COLORS.teal }]}
                height={240}
              />
            ) : (
              <EmptyState
                className="border-none"
                icon={<Award className="w-6 h-6" />}
                title="No marks recorded"
                description="Grade distribution appears once exam marks are entered."
              />
            )}
          </CardContent>
        </Card>

        {/* Gender Split Donut */}
        <Card>
          <CardHeader>
            <CardTitle>Student Gender Split</CardTitle>
          </CardHeader>
          <CardContent>
            {genderData.length > 0 ? (
              <DonutChart
                data={genderData}
                centerValue={stats.studentCount}
                centerLabel="Students"
                height={240}
              />
            ) : (
              <EmptyState
                className="border-none"
                icon={<Users className="w-6 h-6" />}
                title="No students yet"
                description="Enroll students to see the breakdown."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Admissions + Attendance Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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
              {stats.recentAdmissions.length > 0 ? (
                <Table className="border-none shadow-none rounded-none">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Guardian</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentAdmissions.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={`${s.firstName} ${s.lastName}`} size="xs" />
                            <span className="font-semibold text-slate-800">
                              {s.firstName} {s.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral" size="sm" isMono>
                            {s.rollNumber}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs">
                          {s.className} {s.sectionName ? `· ${s.sectionName}` : ""}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {s.guardianName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={s.status === "active" ? "success" : "neutral"}
                            size="sm"
                            dot
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  className="border-none"
                  icon={<GraduationCap className="w-6 h-6" />}
                  title="No students yet"
                  description="Seed demo data or enroll your first student to get started."
                  action={
                    <Button variant="primary" size="sm" onClick={onOpenAddStudent}>
                      Enroll Student
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Attendance Pulse */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceData.length > 0 ? (
                <DonutChart
                  data={attendanceData}
                  centerValue={
                    stats.todayAttendanceRate !== null
                      ? `${stats.todayAttendanceRate}%`
                      : "—"
                  }
                  centerLabel="Present"
                  height={240}
                />
              ) : (
                <EmptyState
                  className="border-none"
                  icon={<CalendarCheck className="w-6 h-6" />}
                  title="Not recorded"
                  description="No attendance has been recorded for today yet."
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate("attendance")}
                    >
                      Record Attendance
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card variant="subtle">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#CCFBF1] text-[#0D9488] flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-800">
                  {stats.classCount} classes · {stats.sectionCount} sections
                </div>
                <div className="text-[11px] text-slate-500">
                  Live multi-tenant Convex backend
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
