"use client";

import React from "react";
import { ShieldCheck, Database, Sparkles } from "lucide-react";
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

      {/* Ambient Teal + Indigo radial spotlights */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[340px] rounded-full bg-teal-500/15 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 w-[520px] h-[280px] rounded-full bg-indigo-500/10 blur-[110px]" />

      {/* Subtle fine geometric grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#33415512_1px,transparent_1px),linear-gradient(to_bottom,#33415512_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className={cn("relative z-10 w-full", wide ? "max-w-3xl" : "max-w-md")}>
        <div className="flex flex-col items-center justify-center mb-5 text-center">
          <div className="p-3 bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl shadow-teal-950/50 mb-2.5 ring-1 ring-teal-400/20">
            <AcademiXLogo size={36} inverted />
          </div>
        </div>

        <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 border border-slate-200/90 p-6 sm:p-8 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500" />
          {children}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400 font-medium">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            256-Bit JWT &amp; TOTP 2FA
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Read-Replica Load Balanced
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Multi-Tenant ERP
          </span>
        </div>
      </div>
    </div>
  );
}
