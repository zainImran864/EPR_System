"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Mail, KeyRound, Copy, Check, Hash, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { previewEmail } from "@/app/lib/emailPreview";
import { teachersApi } from "@/app/api/teachers";
import { useActiveSchool } from "@/app/hooks/useActiveSchool";

export interface AddTeacherSubmit {
  firstName: string;
  lastName: string;
  phone?: string;
  designation: string;
  department: string;
  joinDate?: string;
  status: "active" | "inactive";
  password: string;
  personalEmail?: string;
}

export interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (t: AddTeacherSubmit) => Promise<unknown> | void;
  /** Tenant code used to preview the auto-generated login email. */
  schoolCode?: string | null;
}

const DEPARTMENTS = [
  "Science",
  "Mathematics",
  "Languages",
  "Social Studies",
  "Computer Science",
  "Physical Education",
  "Arts",
  "Administration",
];

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  designation: "",
  department: DEPARTMENTS[0],
  joinDate: "",
  status: "active" as "active" | "inactive",
  password: "",
  personalEmail: "",
};

export const AddTeacherModal: React.FC<AddTeacherModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  schoolCode,
}) => {
  const { schoolId } = useActiveSchool();
  const nextEmpId = useQuery(
    teachersApi.nextEmployeeId,
    schoolId && isOpen ? { schoolId } : "skip"
  );

  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullName = `${form.firstName} ${form.lastName}`.trim();
  const emailPreview = useMemo(
    () => previewEmail(fullName || "new teacher", "teacher", schoolCode),
    [fullName, schoolCode]
  );

  const isValid =
    form.firstName &&
    form.lastName &&
    form.designation &&
    form.department &&
    form.password.length >= 6;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        designation: form.designation,
        department: form.department,
        joinDate: form.joinDate || undefined,
        status: form.status,
        password: form.password,
        personalEmail: form.personalEmail || undefined,
      });
      setForm(emptyForm);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Faculty Member"
      description="Provision a teacher profile and login. The employee ID and login email are generated automatically."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!isValid}
            type="submit"
          >
            Create & Provision Login
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name *"
            placeholder="e.g. Sara"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
          />
          <Input
            label="Last Name *"
            placeholder="e.g. Ahmed"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Employee ID (auto)"
            value={nextEmpId ?? "…"}
            disabled
            leftIcon={<Hash className="w-3.5 h-3.5" />}
            helperText="Generated automatically"
          />
          <Input
            label="Designation *"
            placeholder="e.g. Senior Teacher"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            required
          />
          <Select
            label="Department *"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Phone"
            placeholder="e.g. +1 555-201-8890"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Join Date"
            type="date"
            value={form.joinDate}
            onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as "active" | "inactive" })
            }
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>

        {/* Login provisioning */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Login Credentials
          </span>
        </div>

        {/* Auto email preview */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">
            Auto-generated Login Email
          </label>
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-teal-200 bg-teal-50/60">
            <span className="flex items-center gap-2 text-sm font-mono-data text-teal-800 truncate">
              <Mail className="w-4 h-4 text-teal-500 shrink-0" />
              {emailPreview}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-100 transition-colors shrink-0"
              title="Copy email"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            A numeric suffix is appended automatically if this email already exists.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Temporary Password *"
            type="text"
            placeholder="Min. 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            leftIcon={<KeyRound className="w-4 h-4" />}
            required
          />
          <Input
            label="Teacher's Personal Email"
            type="email"
            placeholder="Where to send the login"
            value={form.personalEmail}
            onChange={(e) => setForm({ ...form, personalEmail: e.target.value })}
            leftIcon={<Send className="w-4 h-4" />}
            helperText="Credentials are emailed here (via your school SMTP)."
          />
        </div>
      </form>
    </Modal>
  );
};
