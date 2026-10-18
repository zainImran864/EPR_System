"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/app/hooks/useAuth";

export interface RoleWelcomeTile {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
}

export interface RoleWelcomeProps {
  greeting: string;
  blurb: string;
  tiles: RoleWelcomeTile[];
}

/** Shared dashboard hero + quick-link tiles for the teacher/student/parent portals. */
export const RoleWelcome: React.FC<RoleWelcomeProps> = ({ greeting, blurb, tiles }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-brand-hero p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-semibold tracking-wide mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{user?.school?.name ?? "AcademiX Portal"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {greeting}, {user?.name ?? "there"}
          </h2>
          <p className="text-xs sm:text-sm text-white/85 mt-1.5 max-w-xl leading-relaxed">
            {blurb}
          </p>
        </div>
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-16 right-20 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="group">
            <Card className="h-full transition-all duration-200 group-hover:shadow-md group-hover:border-primary/40 group-hover:-translate-y-0.5">
              <CardContent className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary border border-primary-100 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:bg-primary group-hover:text-white">
                    <t.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-1" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
