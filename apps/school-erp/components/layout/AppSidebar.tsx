"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/app/store/useAppStore";
import { cn } from "@/app/lib/utils";
import { ChevronLeft, ChevronRight, School, X } from "lucide-react";
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
  const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const pathname = usePathname();

  // Group nav items by `group` preserving order
  const groupedNav = useMemo(() => {
    const groups: { label: string | null; items: NavLink[] }[] = [];
    for (const item of nav) {
      const g = item.group ?? null;
      const last = groups[groups.length - 1];
      if (!last || last.label !== g) {
        groups.push({ label: g, items: [item] });
      } else {
        last.items.push(item);
      }
    }
    return groups;
  }, [nav]);

  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Sidebar Navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0F172A] text-[#CBD5E1] border-r border-slate-800/80 transition-all duration-300 ease-in-out select-none shadow-xl md:shadow-none",
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "-translate-x-full md:translate-x-0 md:w-20"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "border-b border-slate-800/80",
            isSidebarOpen
              ? "h-16 flex items-center justify-between px-4"
              : "py-3 flex flex-col items-center gap-2 px-3"
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            {schoolLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={schoolLogoUrl}
                alt={schoolName}
                className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-700 shadow-sm"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-md shadow-black/30 ring-1 ring-white/15"
                style={{ backgroundColor: "var(--sidebar-accent, var(--color-primary))" }}
              >
                <School className="w-5 h-5" />
              </div>
            )}
            {isSidebarOpen && (
              <div className="flex flex-col truncate min-w-0">
                <span className="text-sm font-bold text-white truncate tracking-tight">
                  {schoolName}
                </span>
                {schoolCode ? (
                  <span
                    className="text-[10px] font-mono-data uppercase font-semibold tracking-wider"
                    style={{ color: "var(--color-primary-300)" }}
                  >
                    {schoolCode}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    Academic Portal
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/90 transition-colors hidden md:flex items-center justify-center shrink-0"
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          {isSidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Grouped Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {groupedNav.map((group, gIdx) => (
            <div key={group.label ?? `group-${gIdx}`} className="space-y-1">
              {group.label && isSidebarOpen && (
                <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {group.label}
                </div>
              )}
              {group.label && !isSidebarOpen && gIdx > 0 && (
                <div className="mx-2 my-2 border-t border-slate-800/80" />
              )}
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    title={!isSidebarOpen ? item.label : undefined}
                    style={
                      isActive
                        ? { backgroundColor: "var(--sidebar-accent, var(--color-primary))" }
                        : undefined
                    }
                    className={cn(
                      "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group",
                      !isSidebarOpen && "justify-center px-0",
                      isActive
                        ? "text-white font-semibold shadow-md shadow-black/20 ring-1 ring-white/15"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/75"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 transition-transform duration-150 group-hover:scale-110",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                      )}
                    >
                      {item.icon}
                    </span>
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer + Attribution */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0B1120]/70">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl p-1.5",
              !isSidebarOpen && "justify-center p-0"
            )}
          >
            <Avatar name={userName} size={isSidebarOpen ? "md" : "sm"} status="online" />
            {isSidebarOpen && (
              <div className="flex flex-col truncate min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  {userName}
                </span>
                <span
                  className="text-[10px] font-medium capitalize truncate"
                  style={{ color: "var(--color-primary-300)" }}
                >
                  {userRole}
                </span>
              </div>
            )}
          </div>
          {isSidebarOpen && <MadeByAcademiX inverted className="mt-2.5" />}
        </div>
      </aside>
    </>
  );
};

