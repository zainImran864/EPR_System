"use client";

import React from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { STUDENT_NAV } from "@/components/layout/navConfig";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow={["student"]}>
      <AppShell nav={STUDENT_NAV} roleLabel="Student">
        {children}
      </AppShell>
    </RoleGate>
  );
}
