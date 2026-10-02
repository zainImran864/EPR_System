"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/app/store/useAppStore";
import { cn } from "@/app/lib/utils";
import { ChevronLeft, ChevronRight, School } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { MadeByAcademiX } from "@/components/brand/AcademiXLogo";
import type { NavLink } from "./navConfig";

export interface AppSidebarProps {
  nav: NavLink[];
  schoolName?: string;
  schoolCode?: string;
  schoolLogoUrl?: string | null;
  userName?: string;
  userRole?: string;
}

/** Route-aware sidebar (Link + usePathname) used by every role portal. */
export const AppSidebar: React.FC<AppSidebarProps> = ({
  nav,
  schoolName = "AcademiX",
  schoolCode,
  schoolLogoUrl,
  userName = "User",
  userRole = "Member",
}) => {
  const { isSidebarOpen, toggleSidebar } = useAppStore();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0F172A] text-[#CBD5E1] border-r border-slate-800 transition-all duration-300 ease-in-out select-none",
        isSidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "border-b border-slate-800",
          isSidebarOpen
            ? "h-16 flex items-center justify-between px-4"
            : "py-3 flex flex-col items-center gap-2 px-3"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {schoolLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={schoolLogoUrl}
              alt={schoolName}
              className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-700"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-md shadow-black/30"
              style={{ backgroundColor: "var(--sidebar-accent, #0D9488)" }}
            >
              <School className="w-5 h-5" />
            </div>
          )}
          {isSidebarOpen && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold text-white truncate tracking-tight">
                {schoolName}
              </span>
              {schoolCode && (
                <span className="text-[10px] text-teal-400 font-mono-data uppercase font-semibold">
                  {schoolCode}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden md:flex items-center justify-center"
          title={isSidebarOpen ? "Collapse" : "Expand"}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={
                isActive
                  ? { backgroundColor: "var(--sidebar-accent, #0D9488)" }
                  : undefined
              }
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group",
                isActive
                  ? "text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/70"
              )}
            >
              <span
                className={cn(
                  "shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                )}
              >
                {item.icon}
              </span>
              {isSidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + attribution */}
      <div className="p-3 border-t border-slate-800 bg-[#0B1120]/60">
        <div className="flex items-center gap-3">
          <Avatar name={userName} size={isSidebarOpen ? "md" : "sm"} status="online" />
          {isSidebarOpen && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-white truncate">{userName}</span>
              <span className="text-[10px] text-teal-400 font-medium capitalize">
                {userRole}
              </span>
            </div>
          )}
        </div>
        {isSidebarOpen && <MadeByAcademiX inverted className="mt-3" />}
      </div>
    </aside>
  );
};
