"use client";

import React from "react";
import Link from "next/link";
import { Clock, LogOut } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/app/hooks/useAuth";

export default function PendingPage() {
  const { user, logout } = useAuth();

  return (
    <AuthShell>
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Your account is under review</h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
          A platform administrator is reviewing your school registration. Please
          check back later — once approved, you&apos;ll have full access to your
          dashboard.
        </p>

        {user && (
          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Signed in as
            </span>
            <div className="font-mono-data text-sm font-semibold text-slate-800 mt-1 break-all">
              {user.email}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <Link href="/login">
            <Button variant="outline" fullWidth>
              Back to Sign In
            </Button>
          </Link>
          {user && (
            <Button
              variant="ghost"
              fullWidth
              onClick={logout}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign out
            </Button>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
