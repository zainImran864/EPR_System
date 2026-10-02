"use client";

import React from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { TEACHER_NAV } from "@/components/layout/navConfig";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow={["teacher"]}>
      <AppShell nav={TEACHER_NAV} roleLabel="Teacher">
        {children}
      </AppShell>
    </RoleGate>
  );
}
