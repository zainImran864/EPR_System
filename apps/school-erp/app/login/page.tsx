"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, LogIn, AlertCircle, ShieldCheck, KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useAuth } from "@/app/hooks/useAuth";
import { ROLE_HOME } from "@/components/auth/RoleGate";

export default function LoginPage() {
  const { login, verifyLoginTwoFactor, user, role, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Two-factor challenge state
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);

  // Already logged in → bounce to the right dashboard.
  useEffect(() => {
    if (!isLoading && user && role) router.replace(ROLE_HOME[role]);
  }, [isLoading, user, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (res.ok && res.role) {
        router.replace(ROLE_HOME[res.role]);
      } else if ("status" in res && res.status === "2fa" && res.token) {
        setPendingToken(res.token); // show the code step
      } else if ("status" in res && res.status === "pending") {
        router.replace(`/pending?email=${encodeURIComponent(email.trim())}`);
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

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingToken || code.replace(/\D/g, "").length !== 6) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await verifyLoginTwoFactor(pendingToken, code, rememberDevice);
      if (res.ok && res.role) {
        router.replace(ROLE_HOME[res.role]);
      } else if ("error" in res && res.error === "expired") {
        setError("The login timed out. Please sign in again.");
        setPendingToken(null);
      } else {
        setError("Invalid code — please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not verify the code.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Two-factor code step ──
  if (pendingToken) {
    return (
      <AuthShell>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0D9488]" />
            Two-Factor Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter the 6-digit code from your authenticator app to continue.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleVerify2fa} className="space-y-4">
          <Input
            label="Authenticator code"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            leftIcon={<KeyRound className="w-4 h-4" />}
            className="tracking-[0.4em] text-center font-mono-data text-lg"
            autoFocus
            required
          />

          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
            <span className="text-xs text-slate-600">
              Remember this device (skip 2FA next time)
            </span>
            <Switch checked={rememberDevice} onCheckedChange={setRememberDevice} />
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={submitting}
            disabled={code.replace(/\D/g, "").length !== 6}
            leftIcon={<LogIn className="w-4 h-4" />}
          >
            Verify & Continue
          </Button>
          <button
            type="button"
            onClick={() => {
              setPendingToken(null);
              setCode("");
              setError(null);
            }}
            className="w-full text-xs text-slate-500 hover:text-slate-800"
          >
            ← Back to sign in
          </button>
        </form>
      </AuthShell>
    );
  }

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
