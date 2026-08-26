"use client";

import React from "react";
import { CalendarDays, Award, ClipboardCheck, BookOpen } from "lucide-react";
import { RoleGate } from "@/components/auth/RoleGate";
import { RoleHeader } from "@/components/layout/RoleHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/app/hooks/useAuth";

const FEATURES = [
  { icon: BookOpen, title: "My Classes", desc: "Classes you're in charge of, students & subjects you teach." },
  { icon: CalendarDays, title: "My Timetable", desc: "Your weekly lecture schedule, auto-built from the school timetable." },
  { icon: Award, title: "Marks Upload", desc: "Enter marks per class, section & subject with automatic grading." },
  { icon: ClipboardCheck, title: "Attendance", desc: "Mark per-lecture attendance for your classes." },
];

function TeacherDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <RoleHeader
        title="Teacher Portal"
        schoolName={user?.school?.name}
        userName={user?.name ?? "Teacher"}
        roleLabel="Teacher"
        onLogout={logout}
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#0D9488] to-[#115E59] p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold">Welcome, {user?.name ?? "Teacher"}</h2>
          <p className="text-sm text-teal-100 mt-1">
            Your classes, timetable, marks and attendance tools live here.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{f.title}</h3>
                    <Badge variant="neutral" size="sm">Coming soon</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function TeacherDashboardPage() {
  return (
    <RoleGate allow={["teacher"]}>
      <TeacherDashboard />
    </RoleGate>
  );
}
