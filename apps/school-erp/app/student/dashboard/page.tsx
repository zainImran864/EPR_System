"use client";

import React from "react";
import { CalendarDays, Award, ClipboardCheck, User } from "lucide-react";
import { RoleGate } from "@/components/auth/RoleGate";
import { RoleHeader } from "@/components/layout/RoleHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/app/hooks/useAuth";

const FEATURES = [
  { icon: CalendarDays, title: "My Timetable", desc: "Your weekly class schedule and teachers." },
  { icon: Award, title: "My Results", desc: "Your marks and grades across all subjects and exams." },
  { icon: ClipboardCheck, title: "My Attendance", desc: "Your attendance record across the term." },
  { icon: User, title: "My Profile", desc: "Your enrollment and guardian details." },
];

function StudentDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <RoleHeader
        title="Student Portal"
        schoolName={user?.school?.name}
        schoolLogoUrl={user?.school?.logoUrl}
        userName={user?.name ?? "Student"}
        roleLabel="Student"
        onLogout={logout}
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#0D9488] to-[#115E59] p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold">Hi, {user?.name ?? "Student"}</h2>
          <p className="text-sm text-teal-100 mt-1">
            Track your timetable, results and attendance in one place.
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

export default function StudentDashboardPage() {
  return (
    <RoleGate allow={["student"]}>
      <StudentDashboard />
    </RoleGate>
  );
}
