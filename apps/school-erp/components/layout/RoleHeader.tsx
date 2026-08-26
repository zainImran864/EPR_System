"use client";

import React from "react";
import { School, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { AcademiXMark } from "@/components/brand/AcademiXLogo";

export interface RoleHeaderProps {
  title: string;
  subtitle?: string;
  schoolName?: string;
  schoolLogoUrl?: string | null;
  userName: string;
  roleLabel: string;
  onLogout?: () => void;
  /** Platform console (super-admin) — brands with AcademiX instead of a school. */
  platform?: boolean;
}

/** Lightweight fixed top bar for teacher / student / parent / super-admin pages. */
export const RoleHeader: React.FC<RoleHeaderProps> = ({
  title,
  subtitle,
  schoolName,
  schoolLogoUrl,
  userName,
  roleLabel,
  onLogout,
  platform = false,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {platform ? (
          <AcademiXMark size={36} />
        ) : schoolLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={schoolLogoUrl}
            alt={schoolName ?? "School"}
            className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#2DD4BF] text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-900/20">
            <School className="w-5 h-5" />
          </div>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
            <Badge variant="primary" size="sm">
              {roleLabel}
            </Badge>
          </div>
          <span className="text-[11px] text-slate-500">
            {subtitle}
            {subtitle && schoolName ? " · " : ""}
            {schoolName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-2">
        <Avatar name={userName} size="sm" />
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[160px]">
            {userName}
          </span>
          <span className="text-[10px] text-slate-500 capitalize">{roleLabel}</span>
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
    </header>
  );
};
