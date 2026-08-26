"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { ROLE_HOME } from "@/components/auth/RoleGate";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Root gate: sends users to their role dashboard, or to /login when there is
 * no active session.
 */
export default function Home() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role) router.replace(ROLE_HOME[role]);
  }, [isLoading, user, role, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
      <Spinner size="lg" />
      <span className="text-xs text-slate-500">Preparing your portal…</span>
    </div>
  );
}
