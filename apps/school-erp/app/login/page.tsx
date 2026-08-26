"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, LogIn, AlertCircle, Clock } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/app/hooks/useAuth";
import { ROLE_HOME } from "@/components/auth/RoleGate";

export default function LoginPage() {
  const { login, user, role, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Already logged in → bounce to the right dashboard.
  useEffect(() => {
    if (!isLoading && user && role) router.replace(ROLE_HOME[role]);
  }, [isLoading, user, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(false);
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (res.ok && res.role) {
        router.replace(ROLE_HOME[res.role]);
      } else if ("status" in res && res.status === "pending") {
        setPending(true);
      } else if ("status" in res && res.status === "inactive") {
        setError("This account is inactive. Please contact your administrator.");
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Sign in to your portal
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Use the email and password provided by your school.
        </p>
      </div>

      {pending && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800">
          <Clock className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed">
            Your school registration is <strong>under review</strong>. You&apos;ll
            be able to sign in once a platform administrator approves it.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="text"
          placeholder="you@yourschool.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={submitting}
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Want to bring your school onboard?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#0D9488] hover:underline"
          >
            Register your school
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
