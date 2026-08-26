"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Mail, Hash, KeyRound, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { previewEmail } from "@/app/lib/emailPreview";
import { studentsApi } from "@/app/api/students";
import { useActiveSchool } from "@/app/hooks/useActiveSchool";

export interface AddStudentSubmit {
  firstName: string;
  lastName: string;
  rollNumber: string;
  classId: string;
  sectionId: string;
  gender: "male" | "female" | "other";
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  studentContactEmail?: string;
  password?: string;
}

export interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (student: AddStudentSubmit) => Promise<unknown> | void;
  classOptions: { value: string; label: string }[];
  getSections: (classId: string) => { value: string; label: string }[];
  schoolCode?: string | null;
}

const emptyForm = {
  firstName: "",
  lastName: "",
  rollNumber: "",
  classId: "",
  sectionId: "",
  gender: "male" as "male" | "female" | "other",
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  studentContactEmail: "",
  password: "",
};

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  classOptions,
  getSections,
  schoolCode,
}) => {
  const { schoolId } = useActiveSchool();
  const nextAdmission = useQuery(
    studentsApi.nextAdmissionNumber,
    schoolId && isOpen ? { schoolId } : "skip"
  );

  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sectionOptions = formData.classId ? getSections(formData.classId) : [];

  const fullName = `${formData.firstName} ${formData.lastName}`.trim();
  const studentEmail = useMemo(
    () => previewEmail(fullName || "new student", "student", schoolCode),
    [fullName, schoolCode]
  );
  const parentEmail = useMemo(
    () => previewEmail(fullName || "new student", "parent", schoolCode),
    [fullName, schoolCode]
  );

  const isValid =
    formData.firstName &&
    formData.lastName &&
    formData.rollNumber &&
    formData.classId &&
    formData.sectionId &&
    formData.guardianName &&
    formData.guardianPhone &&
    formData.password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName: formData.firstName,
        lastName: formData.lastName,
        rollNumber: formData.rollNumber,
        classId: formData.classId,
        sectionId: formData.sectionId,
        gender: formData.gender,
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone,
        guardianEmail: formData.guardianEmail || undefined,
        studentContactEmail: formData.studentContactEmail || undefined,
        password: formData.password,
      });
      setFormData(emptyForm);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const noClasses = classOptions.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll New Student"
      description="Register a student to an active class. The admission number and student + parent logins are generated automatically."
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
            Complete Admission
          </Button>
        </>
      }
    >
      {noClasses ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          You need at least one class with a section before enrolling students. Create
          one under <b>Classes &amp; Sections</b> first.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              placeholder="e.g. Liam"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name *"
              placeholder="e.g. Chen"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          {/* Academic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Admission No (auto)"
              value={nextAdmission ?? "…"}
              disabled
              leftIcon={<Hash className="w-3.5 h-3.5" />}
              helperText="Generated automatically"
            />
            <Input
              label="Roll Number *"
              placeholder="e.g. 10-A-06"
              value={formData.rollNumber}
              onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              required
            />
            <Select
              label="Gender *"
              value={formData.gender}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  gender: e.target.value as "male" | "female" | "other",
                })
              }
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Class / Grade *"
              value={formData.classId}
              placeholder="Select class"
              onChange={(e) =>
                setFormData({ ...formData, classId: e.target.value, sectionId: "" })
              }
              options={classOptions}
            />
            <Select
              label="Section *"
              value={formData.sectionId}
              placeholder={formData.classId ? "Select section" : "Choose a class first"}
              disabled={!formData.classId}
              onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
              options={sectionOptions}
            />
          </div>

          {/* Guardian Contact */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Guardian Contact Information
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Guardian Name *"
              placeholder="e.g. Hui Chen"
              value={formData.guardianName}
              onChange={(e) =>
                setFormData({ ...formData, guardianName: e.target.value })
              }
              required
            />
            <Input
              label="Guardian Phone *"
              placeholder="e.g. +1 555-444-1104"
              value={formData.guardianPhone}
              onChange={(e) =>
                setFormData({ ...formData, guardianPhone: e.target.value })
              }
              required
            />
          </div>

          {/* Login provisioning */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Auto-generated Logins
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="px-3 py-2.5 rounded-xl border border-teal-200 bg-teal-50/60">
              <div className="text-[10px] uppercase tracking-wide text-teal-600 font-semibold mb-1">
                Student login
              </div>
              <span className="flex items-center gap-2 text-xs font-mono-data text-teal-800 truncate">
                <Mail className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                {studentEmail}
              </span>
            </div>
            <div className="px-3 py-2.5 rounded-xl border border-teal-200 bg-teal-50/60">
              <div className="text-[10px] uppercase tracking-wide text-teal-600 font-semibold mb-1">
                Parent login
              </div>
              <span className="flex items-center gap-2 text-xs font-mono-data text-teal-800 truncate">
                <Mail className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                {parentEmail}
              </span>
            </div>
          </div>

          <Input
            label="Portal Password * (used for both student & parent)"
            type="text"
            placeholder="Min. 6 characters"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            leftIcon={<KeyRound className="w-4 h-4" />}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Student's Email (to send login)"
              type="email"
              placeholder="student@example.com"
              value={formData.studentContactEmail}
              onChange={(e) =>
                setFormData({ ...formData, studentContactEmail: e.target.value })
              }
              leftIcon={<Send className="w-4 h-4" />}
            />
            <Input
              label="Guardian Email (to send login)"
              type="email"
              placeholder="guardian@example.com"
              value={formData.guardianEmail}
              onChange={(e) =>
                setFormData({ ...formData, guardianEmail: e.target.value })
              }
              leftIcon={<Send className="w-4 h-4" />}
            />
          </div>
        </form>
      )}
    </Modal>
  );
};
