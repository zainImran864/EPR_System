"use client";

import React from "react";
import { useAppStore } from "@/app/store/useAppStore";
import { cn } from "@/app/lib/utils";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  School,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { MadeByAcademiX } from "@/components/brand/AcademiXLogo";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export interface SidebarProps {
  activeModule: string;
  onSelectModule: (id: string) => void;
  schoolName?: string;
  schoolCode?: string;
  schoolLogoUrl?: string | null;
  userName?: string;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  schoolName = "Oakridge Academy",
  schoolCode = "OAK-RIDGE",
  schoolLogoUrl,
  userName = "Administrator",
  userRole = "Admin",
}) => {
  const { isSidebarOpen, toggleSidebar } = useAppStore();

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "students", label: "Students", icon: <GraduationCap className="w-4 h-4" />, badge: "5" },
    { id: "classes", label: "Classes & Sections", icon: <BookOpen className="w-4 h-4" /> },
    { id: "attendance", label: "Daily Attendance", icon: <CalendarCheck className="w-4 h-4" /> },
    { id: "marks", label: "Marks & Exams", icon: <Award className="w-4 h-4" /> },
    { id: "teachers", label: "Faculty & Staff", icon: <Users className="w-4 h-4" /> },
    { id: "settings", label: "School Branding", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0F172A] text-[#CBD5E1] border-r border-slate-800 transition-all duration-300 ease-in-out select-none",
        isSidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          {schoolLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={schoolLogoUrl}
              alt={schoolName}
              className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-md shadow-teal-900/40 border border-slate-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#2DD4BF] text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-900/40 font-bold text-base">
              <School className="w-5 h-5" />
            </div>
          )}
          {isSidebarOpen && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold text-white truncate tracking-tight">
                {schoolName}
              </span>
              <span className="text-[10px] text-teal-400 font-mono-data uppercase font-semibold">
                {schoolCode}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden md:flex items-center justify-center"
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2">
          {isSidebarOpen && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Academic Modules
            </span>
          )}
        </div>

        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group",
                isActive
                  ? "bg-[#0D9488] text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/70"
              )}
            >
              <span
                className={cn(
                  "shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-teal-400"
                )}
              >
                {item.icon}
              </span>

              {isSidebarOpen && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-mono-data px-1.5 py-0.2 rounded-full",
                        isActive
                          ? "bg-teal-800 text-teal-100"
                          : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Mini Footer */}
      <div className="p-3 border-t border-slate-800 bg-[#0B1120]/60">
        <div className="flex items-center gap-3">
          <Avatar name={userName} size={isSidebarOpen ? "md" : "sm"} status="online" />
          {isSidebarOpen && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-white truncate">
                {userName}
              </span>
              <span className="text-[10px] text-teal-400 font-medium capitalize">
                {userRole}
              </span>
            </div>
          )}
        </div>

        {/* Platform attribution */}
        {isSidebarOpen && <MadeByAcademiX inverted className="mt-3" />}
      </div>
    </aside>
  );
};
