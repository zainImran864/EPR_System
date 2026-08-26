"use client";

import React from "react";
import { useAppStore } from "@/app/store/useAppStore";
import { cn } from "@/app/lib/utils";
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  LogOut,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

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

        {/* Tenant school brand (name + logo) */}
        {schoolName && (
          <div className="hidden md:flex items-center gap-2.5 pr-3 mr-1 border-r border-slate-200">
            {schoolLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={schoolLogoUrl}
                alt={schoolName}
                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0D9488] to-[#2DD4BF] text-white flex items-center justify-center shrink-0">
                <School className="w-4 h-4" />
              </div>
            )}
            <span className="text-sm font-bold text-slate-900 tracking-tight truncate max-w-[180px]">
              {schoolName}
            </span>
          </div>
        )}

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

      {/* Right: Search, Seed Demo Action, Notifications & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Quick Search */}
        <div className="hidden lg:flex items-center relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search students, roll no..."
            className="w-full bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-xs pl-9 pr-8 py-2 rounded-xl border border-transparent focus:border-[#0D9488] focus:outline-none transition-all placeholder:text-slate-400"
          />
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            /
          </kbd>
        </div>

        {/* Demo Seed Database Button */}
        {onSeedData && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSeedData}
            isLoading={isSeeding}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />}
            className="hidden sm:inline-flex text-xs border-[#99F6E4] bg-[#F0FDFA] text-[#0F766E] hover:bg-[#CCFBF1]"
          >
            Seed Demo Data
          </Button>
        )}

        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white" />
        </button>

        {/* User Mini Avatar Menu */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <Avatar name={userName} size="sm" />
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
              {userName}
            </span>
            <span className="text-[10px] text-slate-500 capitalize">{userRole}</span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out"
              className="ml-1 p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
