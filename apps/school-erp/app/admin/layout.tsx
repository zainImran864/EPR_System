"use client";

import React from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { ADMIN_NAV } from "@/components/layout/navConfig";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell nav={ADMIN_NAV} roleLabel="Administrator">
        {children}
      </AppShell>
    </RoleGate>
  );
}
