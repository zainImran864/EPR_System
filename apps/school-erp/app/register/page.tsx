"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  School,
  Mail,
  Lock,
  User,
  MapPin,
  Phone,
  CheckCircle2,
  Send,
  Check,
  Sparkles,
} from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/useToast";
import { authRestApi } from "@/app/api/auth";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "");

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function RegisterPage() {
  const { register } = useAuth();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({
    schoolName: "",
    address: "",
    phone: "",
    contactEmail: "",
    adminName: "",
    password: "",
    totalTeachers: "",
    totalStudents: "",
  });
  const [classes, setClasses] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string } | null>(null);

  const emailPreview = useMemo(() => {
    if (!form.adminName || !form.schoolName) return "";
    return `${slugify(form.adminName) || "admin"}@${slugify(form.schoolName) || "school"}.com`;
  }, [form.adminName, form.schoolName]);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleGrade = (g: number) =>
    setClasses((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g].sort((a, b) => a - b)
    );

  const selectPreset = (preset: "all" | "primary" | "middle" | "high" | "clear") => {
    if (preset === "all") setClasses(GRADES);
    else if (preset === "primary") setClasses([1, 2, 3, 4, 5]);
    else if (preset === "middle") setClasses([6, 7, 8]);
    else if (preset === "high") setClasses([9, 10, 11, 12]);
    else setClasses([]);
  };

  const isValid =
    form.schoolName.trim().length > 0 &&
    form.contactEmail.trim().length > 0 &&
    form.adminName.trim().length > 0 &&
    form.password.length >= 6 &&
    classes.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setSubmitting(true);

    const payload = {
      schoolName: form.schoolName.trim(),
      address: form.address.trim() || undefined,
      phone: form.phone.trim() || undefined,
      contactEmail: form.contactEmail.trim(),
      classesOffered: classes,
      totalTeachers: form.totalTeachers ? Number(form.totalTeachers) : undefined,
      totalStudents: form.totalStudents ? Number(form.totalStudents) : undefined,
      adminName: form.adminName.trim(),
      password: form.password,
      adminPassword: form.password,
    };

    try {
      let generatedEmail = emailPreview;
      const restRes = await authRestApi.registerSchool(payload);
      if (restRes?.adminEmail) {
        generatedEmail = restRes.adminEmail;
      }

      setDone({ email: generatedEmail });
      success("School registration request submitted for approval!", {
        title: "Registration Received",
      });
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || "Registration failed. Please check your credentials and try again.";
      setError(errMsg);
      toastError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell>
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200/60 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registration Submitted</h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your school has been registered and is <strong>under review</strong> by platform administrators.
          </p>

          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-left shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Your School Admin Account
            </span>
            <div className="font-mono text-sm font-bold text-teal-700 mt-1 break-all bg-white px-3 py-2 rounded-lg border border-slate-200">
              {done.email}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Sign in with this email and the password you specified once approved.
            </p>
          </div>

          <Link href="/login">
            <Button variant="primary" fullWidth className="mt-6 py-2.5 shadow-lg shadow-teal-700/20">
              Go to Sign In
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell wide>
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium mb-3">
          <Sparkles className="w-3 h-3 text-teal-600" />
          Institution Onboarding
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Register Your School
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Provide your school information and select the active grade levels you offer.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-rose-700 text-xs shadow-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* School details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="School / College Name *"
            placeholder="e.g. Oakridge International"
            value={form.schoolName}
            onChange={(e) => set("schoolName", e.target.value)}
            leftIcon={<School className="w-4 h-4 text-slate-400" />}
            required
          />
          <Input
            label="Official Contact Email *"
            type="email"
            placeholder="office@oakridge.edu"
            value={form.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            required
          />
          <Input
            label="Campus Address"
            placeholder="Street address, City"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
          />
          <Input
            label="Phone (WhatsApp / Landline)"
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Classes offered */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                Classes / Grades Offered *
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 font-semibold">
                  {classes.length} selected
                </span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click any grade to toggle, or use quick selection presets below.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => selectPreset("all")}
                className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 font-medium transition-colors"
              >
                All (1–12)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("primary")}
                className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 font-medium transition-colors"
              >
                Primary (1–5)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("middle")}
                className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 font-medium transition-colors"
              >
                Middle (6–8)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("high")}
                className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 font-medium transition-colors"
              >
                High (9–12)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("clear")}
                className="px-2 py-1 rounded-md bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Interactive Grade Cards Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
            {GRADES.map((g) => {
              const isSelected = classes.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                    isSelected
                      ? "bg-teal-50 border-teal-500 text-teal-900 shadow-sm ring-1 ring-teal-500/30"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span>Grade {g}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] transition-colors ${
                      isSelected
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Capacity */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Total Teachers (approx.)"
            type="number"
            placeholder="e.g. 40"
            value={form.totalTeachers}
            onChange={(e) => set("totalTeachers", e.target.value)}
          />
          <Input
            label="Total Students (approx.)"
            type="number"
            placeholder="e.g. 600"
            value={form.totalStudents}
            onChange={(e) => set("totalStudents", e.target.value)}
          />
        </div>

        {/* Admin credentials */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            School Administrator Account
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Principal / Admin Full Name *"
            placeholder="e.g. Dr. Arthur Admin"
            value={form.adminName}
            onChange={(e) => set("adminName", e.target.value)}
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            required
          />
          <Input
            label="Account Password *"
            type="password"
            placeholder="min. 6 characters"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            error={
              form.password && form.password.length < 6
                ? "At least 6 characters required"
                : undefined
            }
            required
          />
        </div>

        {emailPreview && (
          <div className="rounded-xl bg-teal-50/80 border border-teal-200 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-teal-800 font-bold block">
                Auto-Generated Admin Login Email
              </span>
              <div className="font-mono text-xs font-bold text-teal-900 mt-0.5 break-all">
                {emailPreview}
              </div>
            </div>
            <span className="text-[10px] text-teal-700 bg-white/80 px-2 py-1 rounded-md border border-teal-200/60 font-medium">
              Ready
            </span>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={submitting}
          disabled={!isValid}
          leftIcon={<Send className="w-4 h-4" />}
          className="py-2.5 font-semibold shadow-lg shadow-teal-700/20"
        >
          Submit School Registration
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Already onboarded?{" "}
          <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
