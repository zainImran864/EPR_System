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

export default function Home() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [isSeeding, setIsSeeding] = useState(false);
  const seedSchool = useSeed();

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedSchool({});
      if (result?.alreadySeeded) {
        alert("Demo data already present for this tenant.");
      } else {
        alert("Oakridge International Academy demo data seeded successfully!");
      }
    } catch (err) {
      console.error("Seed failed", err);
      alert("Seeding failed — is the Convex backend deployed?");
    } finally {
      setIsSeeding(false);
    }
  };

  const getModuleTitle = () => {
    switch (activeModule) {
      case "dashboard":
        return {
          title: "Oakridge Academy Portal",
          subtitle: "Administrative Command & Operations Overview",
        };
      case "students":
        return {
          title: "Student Admissions & Directory",
          subtitle: "Student Rosters, Guardian Contacts & Enrollments",
        };
      case "classes":
        return {
          title: "Academic Curriculum & Classes",
          subtitle: "Grade Levels, Section Capacities & Class Teachers",
        };
      case "attendance":
        return {
          title: "Attendance Management",
          subtitle: "Session-wise Marking & Attendance Rates",
        };
      case "marks":
        return {
          title: "Examinations & Grading",
          subtitle: "Term Mark Entry & Automated Performance Calculation",
        };
      case "teachers":
      case "settings":
        return {
          title: "Institutional Branding & Settings",
          subtitle: "Multi-Tenant Configuration & Theme Palettes",
        };
      default:
        return {
          title: "Oakridge Academy",
          subtitle: "Academic Session 2026-2027",
        };
    }
  };

  const { title, subtitle } = getModuleTitle();

  return (
    <Shell
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      title={title}
      subtitle={subtitle}
      onSeedData={handleSeedData}
      isSeeding={isSeeding}
      schoolName="Oakridge Academy"
      schoolCode="OAK-RIDGE"
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
}
