"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/app/store/useAppStore";
import { cn } from "@/app/lib/utils";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { navTitle, type NavLink } from "./navConfig";
import { useAuth } from "@/app/hooks/useAuth";

export interface AppShellProps {
  nav: NavLink[];
  roleLabel: string;
  subtitle?: string;
  /** Optional Topbar action (e.g. seed demo data on the admin portal). */
  onSeedData?: () => void;
  isSeeding?: boolean;
  children: React.ReactNode;
}

/**
 * Route-aware application shell shared by every role portal.
 * Renders the sidebar (from `nav`) + fixed Topbar and derives the page title
 * from the current pathname. Pulls tenant + user context from the session.
 */
export const AppShell: React.FC<AppShellProps> = ({
  nav,
  roleLabel,
  subtitle,
  onSeedData,
  isSeeding,
  children,
}) => {
  const { isSidebarOpen } = useAppStore();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const title = navTitle(nav, pathname);
  const schoolName = user?.school?.name ?? "AcademiX";
  const schoolCode = user?.school?.code;
  const schoolLogoUrl = user?.school?.logoUrl ?? null;
  const userName = user?.name ?? roleLabel;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppSidebar
        nav={nav}
        schoolName={schoolName}
        schoolCode={schoolCode}
        schoolLogoUrl={schoolLogoUrl}
        userName={userName}
        userRole={roleLabel}
      />

      <Topbar
        title={title}
        subtitle={subtitle ?? schoolName}
        userName={userName}
        userRole={roleLabel}
        onLogout={logout}
        schoolName={schoolName}
        schoolLogoUrl={schoolLogoUrl}
        onSeedData={onSeedData}
        isSeeding={isSeeding}
      />

      <main
        className={cn(
          "pt-16 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "md:pl-64" : "md:pl-20"
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
};
