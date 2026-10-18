"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Crown,
  School,
  GraduationCap,
  BookOpen,
  Users,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/useToast";
import { ROLE_HOME } from "@/components/auth/RoleGate";

const DEMO_ACCOUNTS = [
  {
    role: "SUPER_ADMIN",
    label: "Super Admin",
    email: "superadmin@academix.com",
    pass: "SuperAdmin@123",
    icon: Crown,
    badge: "System Owner",
    accent: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    role: "ADMIN",
    label: "School Admin",
    email: "admin@oakridge.edu",
    pass: "Admin@123",
    icon: School,
    badge: "Principal",
    accent: "text-teal-600 bg-teal-50 border-teal-200",
  },
  {
    role: "TEACHER",
    label: "Teacher",
    email: "sarah@oakridge.edu",
    pass: "Teacher@123",
    icon: BookOpen,
    badge: "Faculty",
    accent: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  {
    role: "STUDENT",
    label: "Student",
    email: "alice@oakridge.edu",
    pass: "Student@123",
    icon: GraduationCap,
    badge: "Class 10-A",
    accent: "text-sky-600 bg-sky-50 border-sky-200",
  },
  {
    role: "PARENT",
    label: "Parent",
    email: "robert.parent@oakridge.edu",
    pass: "Parent@123",
    icon: Users,
    badge: "Guardian",
    accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
];

export default function LoginPage() {
  const { login, verifyLoginTwoFactor, user, role, isLoading } = useAuth();
  const { success: toastSuccess } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loginSuccessRole, setLoginSuccessRole] = useState<string | null>(null);

  // Two-factor challenge state
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bounce logged-in users to their respective dashboard
  useEffect(() => {
    if (mounted && !isLoading && user && role && !loginSuccessRole) {
      router.replace(ROLE_HOME[role]);
    }
  }, [mounted, isLoading, user, role, router, loginSuccessRole]);

  const triggerSuccessRedirect = (resolvedRole: keyof typeof ROLE_HOME, userEmail: string) => {
    setLoginSuccessRole(resolvedRole);
    toastSuccess(`Signed in as ${userEmail}. Loading your workspace...`, {
      title: "Authentication Verified",
    });
    setTimeout(() => {
      router.replace(ROLE_HOME[resolvedRole]);
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (res.ok && res.role) {
        triggerSuccessRedirect(res.role, email.trim());
      } else if ("status" in res && res.status === "2fa" && res.token) {
        setPendingToken(res.token);
      } else if ("status" in res && res.status === "pending") {
        router.replace(`/pending?email=${encodeURIComponent(email.trim())}`);
      } else if ("status" in res && res.status === "inactive") {
        setError("This account is inactive. Please contact your administrator.");
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the backend server. Please verify Docker/backend is running.");
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
        triggerSuccessRedirect(res.role, email.trim() || "Verified User");
      } else if ("error" in res && res.error === "expired") {
        setError("The login session timed out. Please sign in again.");
        setPendingToken(null);
      } else {
        setError("Invalid 2FA code — please check your authenticator app and try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not verify the 2FA code.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectDemoRole = async (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setSelectedRole(demo.role);
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(demo.email, demo.pass);
      if (res.ok && res.role) {
        triggerSuccessRedirect(res.role, demo.email);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Smooth Login Success Transition State ──
  if (loginSuccessRole) {
    return (
      <AuthShell>
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-bold uppercase tracking-wider">
              Session Authenticated &middot; {loginSuccessRole.replace("_", " ")}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
              Launching Your ERP Workspace
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Syncing live institutional telemetry &amp; role permissions...
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-500 w-full animate-pulse rounded-full" />
          </div>
        </div>
      </AuthShell>
    );
  }

  // ── Two-factor challenge step ──
  if (pendingToken) {
    return (
      <AuthShell>
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Two-Factor Protection
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Security Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Enter the 6-digit authentication code generated by your authenticator app.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-rose-700 text-xs shadow-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleVerify2fa} className="space-y-4">
          <Input
            label="6-Digit Authenticator Code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            leftIcon={<KeyRound className="w-4 h-4 text-teal-600" />}
            className="tracking-[0.4em] text-center font-mono-data text-xl font-bold"
            autoFocus
            required
          />

          <div className="flex items-center justify-between rounded-xl bg-slate-50/80 border border-slate-200 p-3">
            <div className="pr-2">
              <p className="text-xs font-medium text-slate-700">Trust this device</p>
              <p className="text-[11px] text-slate-400">Skip 2FA challenge on next login</p>
            </div>
            <Switch checked={rememberDevice} onCheckedChange={setRememberDevice} />
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={submitting}
            disabled={code.replace(/\D/g, "").length !== 6}
            leftIcon={<LogIn className="w-4 h-4" />}
            className="py-2.5 shadow-lg shadow-teal-700/20"
          >
            Authenticate & Proceed
          </Button>

          <button
            type="button"
            onClick={() => {
              setPendingToken(null);
              setCode("");
              setError(null);
            }}
            className="w-full text-xs text-slate-500 hover:text-slate-800 transition-colors py-1"
          >
            ← Back to sign in
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50/80 border border-teal-200/80 text-teal-700 text-[11px] font-semibold mb-3">
          <Sparkles className="w-3 h-3 text-teal-600" />
          Enterprise Multi-Tenant Portal
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Welcome to AcademiX
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Sign in with your institutional credentials or launch a one-click demo role below.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-rose-700 text-xs shadow-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Institutional Email"
          type="email"
          placeholder="name@school.edu"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSelectedRole(null);
          }}
          leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          required
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setSelectedRole(null);
            }}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={submitting}
          leftIcon={<LogIn className="w-4 h-4" />}
          className="py-2.5 font-semibold shadow-lg shadow-teal-700/20 mt-1"
        >
          Sign In to Portal
        </Button>
      </form>

      {/* Interactive Quick-Role Switcher */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
            One-Click Demo Profiles
          </span>
          <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
            Instant Sandbox Login
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {DEMO_ACCOUNTS.map((demo) => {
            const Icon = demo.icon;
            const isSelected = selectedRole === demo.role;
            return (
              <button
                key={demo.role}
                type="button"
                onClick={() => selectDemoRole(demo)}
                className={`group relative p-2.5 rounded-xl border text-left transition-all duration-150 flex items-start gap-2.5 ${
                  isSelected
                    ? "bg-teal-50/90 border-teal-500 shadow-sm ring-2 ring-teal-500/20"
                    : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-teal-300 hover:shadow-sm"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${demo.accent}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-[11px] text-slate-800 truncate">
                      {demo.label}
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-white/80 text-slate-500 border border-slate-200/70 shrink-0">
                      {demo.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate font-mono mt-0.5">
                    {demo.email}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Registration Link */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Onboarding a new institution?</span>
        <Link
          href="/register"
          className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors"
        >
          Register School <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </AuthShell>
  );
}
