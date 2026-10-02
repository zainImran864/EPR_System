"use client";

import React from "react";
import { cn } from "@/app/lib/utils";
import { AcademiXLogo } from "@/components/brand/AcademiXLogo";

import { InteractiveBackground } from "./InteractiveBackground";

export function AuthShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen bg-[#090D16] flex items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-teal-500 selection:text-white">
      {/* Interactive Cursor Particle & Constellation Canvas */}
      <InteractiveBackground />

      {/* Subtle fine geometric grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#33415512_1px,transparent_1px),linear-gradient(to_bottom,#33415512_1px,transparent_1px)] bg-[size:40px_40px]" />

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
