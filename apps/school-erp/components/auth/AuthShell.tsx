"use client";

import React from "react";
import { School } from "lucide-react";
import { cn } from "@/app/lib/utils";

export function AuthShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0B1120] to-[#042f2e] flex items-center justify-center p-4">
      <div className={cn("w-full", wide ? "max-w-3xl" : "max-w-md")}>
        <div className="flex items-center justify-center gap-2.5 mb-6 text-white">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#2DD4BF] flex items-center justify-center shadow-lg shadow-teal-900/40">
            <School className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">School ERP</span>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8">
          {children}
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-4">
          Multi-tenant School Management Platform
        </p>
      </div>
    </div>
  );
}
