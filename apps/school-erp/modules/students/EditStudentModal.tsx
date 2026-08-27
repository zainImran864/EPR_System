"use client";

import React, { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export interface EditStudentRow {
  _id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  admissionNumber: string;
  classId: string;
  sectionId: string;
  gender: "male" | "female" | "other";
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  status: "active" | "inactive" | "transferred";
}

export interface EditStudentModalProps {
  student: EditStudentRow | null;
  onClose: () => void;
  onSubmit: (studentId: string, fields: Record<string, unknown>) => Promise<unknown> | void;
  classOptions: { value: string; label: string }[];
  getSections: (classId: string) => { value: string; label: string }[];
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  onClose,
  onSubmit,
  classOptions,
  getSections,
}) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    rollNumber: "",
    classId: "",
    sectionId: "",
    gender: "male" as "male" | "female" | "other",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    status: "active" as "active" | "inactive" | "transferred",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
        classId: student.classId,
        sectionId: student.sectionId,
        gender: student.gender,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        guardianEmail: student.guardianEmail ?? "",
        status: student.status,
      });
    }
  }, [student]);

  const sectionOptions = form.classId ? getSections(form.classId) : [];
  const isValid =
    form.firstName &&
    form.lastName &&
    form.rollNumber &&
    form.classId &&
    form.sectionId &&
    form.guardianName &&
    form.guardianPhone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !isValid) return;
    setSaving(true);
    try {
      await onSubmit(student._id, {
        firstName: form.firstName,
        lastName: form.lastName,
        rollNumber: form.rollNumber,
        classId: form.classId,
        sectionId: form.sectionId,
        gender: form.gender,
        guardianName: form.guardianName,
        guardianPhone: form.guardianPhone,
        guardianEmail: form.guardianEmail || undefined,
        status: form.status,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(student)}
      onClose={onClose}
      title="Edit Student"
      description={student ? `Admission ${student.admissionNumber}` : "Update student details."}
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
            isLoading={saving}
            disabled={!isValid}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name *"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
          />
          <Input
            label="Last Name *"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Roll Number *"
            value={form.rollNumber}
            onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
            required
          />
          <Select
            label="Gender *"
            value={form.gender}
            onChange={(e) =>
              setForm({ ...form, gender: e.target.value as "male" | "female" | "other" })
            }
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as "active" | "inactive" | "transferred",
              })
            }
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "transferred", label: "Transferred" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Class / Grade *"
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "" })}
            options={classOptions}
          />
          <Select
            label="Section *"
            value={form.sectionId}
            disabled={!form.classId}
            onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
            options={sectionOptions}
          />
        </div>

        <div className="pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Guardian
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Guardian Name *"
            value={form.guardianName}
            onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
            required
          />
          <Input
            label="Guardian Phone *"
            value={form.guardianPhone}
            onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
            required
          />
          <Input
            label="Guardian Email"
            type="email"
            value={form.guardianEmail}
            onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
};
