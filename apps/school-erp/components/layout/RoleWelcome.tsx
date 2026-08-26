"use client";

import React from "react";
import Link from "next/link";
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
      <div className="rounded-2xl bg-gradient-to-r from-[#0D9488] to-[#115E59] p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">
          {greeting}, {user?.name ?? "there"}
        </h2>
        <p className="text-sm text-teal-100 mt-1">{blurb}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="group">
            <Card className="transition-shadow group-hover:shadow-md">
              <CardContent className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                  <t.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-[#0D9488] transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
