"use client";

import { useRouter } from "next/navigation";
import { DashboardOverview } from "@/modules/dashboard/DashboardOverview";

export default function AdminDashboardPage() {
  const router = useRouter();
  const go = (module: string) => router.push(`/admin/${module}`);

  return (
    <DashboardOverview
      onNavigate={go}
      onOpenAddStudent={() => router.push("/admin/students")}
    />
  );
}
