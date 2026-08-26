"use client";

import React, { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { DashboardOverview } from "@/modules/dashboard/DashboardOverview";
import { StudentDirectory } from "@/modules/students/StudentDirectory";
import { ClassManager } from "@/modules/classes/ClassManager";
import { AttendanceSheet } from "@/modules/attendance/AttendanceSheet";
import { MarkEntryGrid } from "@/modules/marks/MarkEntryGrid";
import { SchoolSettings } from "@/modules/settings/SchoolSettings";
import { useSeed } from "@/app/hooks/useDashboard";
import { useAuth } from "@/app/hooks/useAuth";

const MODULE_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Administration Portal",
    subtitle: "Command & operations overview",
  },
  students: {
    title: "Student Admissions & Directory",
    subtitle: "Rosters, guardian contacts & enrollments",
  },
  classes: {
    title: "Academic Curriculum & Classes",
    subtitle: "Grade levels, section capacities & class teachers",
  },
  attendance: {
    title: "Attendance Management",
    subtitle: "Session-wise marking & attendance rates",
  },
  marks: {
    title: "Examinations & Grading",
    subtitle: "Term mark entry & automated performance",
  },
  teachers: {
    title: "Institutional Branding & Settings",
    subtitle: "Multi-tenant configuration & theme",
  },
  settings: {
    title: "Institutional Branding & Settings",
    subtitle: "Multi-tenant configuration & theme",
  },
};

export const AdminWorkspace: React.FC = () => {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [isSeeding, setIsSeeding] = useState(false);
  const seedSchool = useSeed();
  const { user, logout } = useAuth();

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedSchool({});
      alert(
        result?.alreadySeeded
          ? "Demo data already present for this tenant."
          : "Demo data seeded successfully!"
      );
    } catch (err) {
      console.error("Seed failed", err);
      alert("Seeding failed — is the Convex backend deployed?");
    } finally {
      setIsSeeding(false);
    }
  };

  const meta = MODULE_META[activeModule] ?? MODULE_META.dashboard;
  const schoolName = user?.school?.name ?? "Your School";
  const schoolCode = user?.school?.code ?? "SCHOOL";

  return (
    <Shell
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      title={meta.title}
      subtitle={meta.subtitle}
      onSeedData={handleSeedData}
      isSeeding={isSeeding}
      schoolName={schoolName}
      schoolCode={schoolCode}
      userName={user?.name ?? "Administrator"}
      userRole="Administrator"
      onLogout={logout}
    >
      {activeModule === "dashboard" && (
        <DashboardOverview
          onNavigate={setActiveModule}
          onOpenAddStudent={() => setActiveModule("students")}
        />
      )}
      {activeModule === "students" && <StudentDirectory />}
      {activeModule === "classes" && <ClassManager />}
      {activeModule === "attendance" && <AttendanceSheet />}
      {activeModule === "marks" && <MarkEntryGrid />}
      {(activeModule === "teachers" || activeModule === "settings") && (
        <SchoolSettings />
      )}
    </Shell>
  );
};
