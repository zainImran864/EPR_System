"use client";

import React from "react";
import { cn } from "@/app/lib/utils";
import { AcademiXLogo } from "@/components/brand/AcademiXLogo";

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
        <div className="flex items-center justify-center mb-6">
          <AcademiXLogo size={40} inverted />
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
