"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/app/store/useAppStore";
import { cn } from "@/app/lib/utils";
import { Menu, LogOut, User as UserIcon, ShieldAlert, Settings, ChevronDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/app/hooks/useAuth";

export interface TopbarProps {
  title?: string;
  subtitle?: string;
  onSeedData?: () => void;
  isSeeding?: boolean;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  schoolName?: string;
  schoolLogoUrl?: string | null;
}

export const Topbar: React.FC<TopbarProps> = ({
  title = "Oakridge Academy Portal",
  subtitle = "Academic Year 2026-2027",
  onSeedData,
  isSeeding = false,
  userName = "Administrator",
  userRole = "Admin",
  onLogout,
  schoolName,
  schoolLogoUrl,
}) => {
  const { isSidebarOpen, toggleSidebar } = useAppStore();
  const { user, role } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Role prefix for routes: admin, teacher, student, parent, superadmin
  const rolePrefix = role || (userRole ? userRole.toLowerCase().replace(/[\s_]+/g, "") : "admin");
  const displayEmail = user?.email || `${userName.toLowerCase().replace(/\s+/g, ".")}@school.edu`;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 transition-all duration-300 ease-in-out flex items-center justify-between px-4 sm:px-6",
        isSidebarOpen ? "left-0 md:left-64" : "left-0 md:left-20"
      )}
    >
      {/* Left: Mobile Toggle & Page Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            <Badge variant="primary" size="sm" isMono>
              2026-2027
            </Badge>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Right: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Notification Bell */}
        <NotificationBell />

        {/* User Profile Dropdown Menu */}
        <div className="relative border-l border-slate-200 pl-3" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100/80 transition-all group focus:outline-hidden"
          >
            <Avatar name={userName} size="sm" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                {userName}
              </span>
              <span className="text-[10px] text-slate-500 capitalize">{userRole}</span>
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200", dropdownOpen && "rotate-180")} />
          </button>

          {/* Dropdown Menu Modal */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/10 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header Info */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <Avatar name={userName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                  <p className="text-[11px] text-slate-500 truncate font-mono">{displayEmail}</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/60 uppercase">
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="px-2 py-1.5 space-y-0.5">
                <Link
                  href={`/${rolePrefix}/profile`}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-xl hover:bg-teal-50 hover:text-teal-900 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-teal-600" />
                  <span>My Profile &amp; Biometrics</span>
                </Link>

                <Link
                  href={`/${rolePrefix}/audit-logs`}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-xl hover:bg-teal-50 hover:text-teal-900 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-teal-600" />
                  <span>Audit Logs &amp; Activity</span>
                </Link>

                <Link
                  href={`/${rolePrefix}/settings`}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-xl hover:bg-teal-50 hover:text-teal-900 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Account &amp; System Settings</span>
                </Link>
              </div>

              {/* Logout Footer */}
              {onLogout && (
                <div className="border-t border-slate-100 px-2 pt-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
