"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AdminWorkspace } from "@/components/workspace/AdminWorkspace";

export default function AdminDashboardPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AdminWorkspace />
    </RoleGate>
  );
}
