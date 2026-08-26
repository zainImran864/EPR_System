"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type Role } from "@/app/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";

export const ROLE_HOME: Record<Role, string> = {
  superadmin: "/superadmin/dashboard",
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard",
};

function FullPageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
      <Spinner size="lg" />
      <span className="text-xs text-slate-500">Loading your workspace…</span>
    </div>
  );
}

/**
 * Client-side auth + role guard. Redirects unauthenticated users to /login and
 * users whose role isn't in `allow` to their own dashboard.
 */
export function RoleGate({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role && !allow.includes(role)) {
      router.replace(ROLE_HOME[role]);
    }
  }, [isLoading, user, role, allow, router]);

  if (isLoading || !user || (role && !allow.includes(role))) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
