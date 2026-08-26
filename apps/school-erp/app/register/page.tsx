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
} from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/useToast";

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
  const [classes, setClasses] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string } | null>(null);

  const emailPreview = useMemo(() => {
    if (!form.adminName || !form.schoolName) return "";
    return `${slugify(form.adminName) || "user"}admin@${slugify(form.schoolName) || "school"}.com`;
  }, [form.adminName, form.schoolName]);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleGrade = (g: number) =>
    setClasses((c) => (c.includes(g) ? c.filter((x) => x !== g) : [...c, g].sort((a, b) => a - b)));

  const isValid =
    form.schoolName &&
    form.contactEmail &&
    form.adminName &&
    form.password.length >= 6 &&
    classes.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await register({
        schoolName: form.schoolName,
        address: form.address || undefined,
        phone: form.phone || undefined,
        contactEmail: form.contactEmail,
        classesOffered: classes,
        totalTeachers: form.totalTeachers ? Number(form.totalTeachers) : undefined,
        totalStudents: form.totalStudents ? Number(form.totalStudents) : undefined,
        adminName: form.adminName,
        password: form.password,
      });
      setDone({ email: res.adminEmail });
      success("Registration submitted — check your email for details.", {
        title: "Submitted for approval",
      });
    } catch (err) {
      console.error(err);
      setError("Registration failed. Is the backend running?");
      toastError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell>
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Registration submitted</h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your school is now <strong>under review</strong> by a platform
            administrator. Once approved, sign in with the admin account below.
          </p>
          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Your admin login email
            </span>
            <div className="font-mono-data text-sm font-semibold text-slate-800 mt-1 break-all">
              {done.email}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Use the password you just set.
            </p>
          </div>
          <Link href="/login">
            <Button variant="primary" fullWidth className="mt-5">
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
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Register your school
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit your institution for approval. We&apos;ll generate your admin login.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-700 text-xs">
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
            leftIcon={<School className="w-4 h-4" />}
            required
          />
          <Input
            label="Contact Email *"
            type="email"
            placeholder="office@school.edu"
            value={form.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />
          <Input
            label="Address"
            placeholder="Street, City"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
          />
          <Input
            label="Phone"
            placeholder="+1 555 000 0000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
          />
        </div>

        {/* Classes offered */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-2 block">
            Classes / Grades Offered *
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {GRADES.map((g) => (
              <label
                key={g}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 cursor-pointer hover:border-[#0D9488]/40"
              >
                <Checkbox
                  checked={classes.includes(g)}
                  onCheckedChange={() => toggleGrade(g)}
                  size="sm"
                />
                <span className="text-xs font-medium text-slate-700">Grade {g}</span>
              </label>
            ))}
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
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            School Admin Account
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Admin Name *"
            placeholder="e.g. Jane Principal"
            value={form.adminName}
            onChange={(e) => set("adminName", e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />
          <Input
            label="Password *"
            type="password"
            placeholder="min. 6 characters"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            error={
              form.password && form.password.length < 6
                ? "At least 6 characters"
                : undefined
            }
            required
          />
        </div>

        {emailPreview && (
          <div className="rounded-lg bg-[#F0FDFA] border border-[#99F6E4] p-3">
            <span className="text-[10px] uppercase tracking-wider text-[#0F766E] font-semibold">
              Your generated admin login email
            </span>
            <div className="font-mono-data text-sm font-semibold text-[#0F766E] mt-1 break-all">
              {emailPreview}
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={submitting}
          disabled={!isValid}
          leftIcon={<Send className="w-4 h-4" />}
        >
          Submit for Approval
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Already onboarded?{" "}
          <Link href="/login" className="font-semibold text-[#0D9488] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
