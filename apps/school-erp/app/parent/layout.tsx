"use client";

import React from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { PARENT_NAV } from "@/components/layout/navConfig";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow={["parent"]}>
      <AppShell nav={PARENT_NAV} roleLabel="Parent">
        {children}
      </AppShell>
    </RoleGate>
  );
}
