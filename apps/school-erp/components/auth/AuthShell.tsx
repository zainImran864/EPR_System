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
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden selection:bg-teal-500 selection:text-white">
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-[#0D9488]/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/60 rounded-full blur-2xl" />

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className={cn("relative z-10 w-full", wide ? "max-w-3xl" : "max-w-md")}>
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl mb-3">
            <AcademiXLogo size={36} inverted />
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-slate-200/80 p-6 sm:p-8">
          {children}
        </div>

        <p className="text-center text-xs text-slate-400 mt-5 font-medium tracking-wide">
          Enterprise School ERP &middot; Multi-Tenant Academic Platform
        </p>
      </div>
    </div>
  );
}
