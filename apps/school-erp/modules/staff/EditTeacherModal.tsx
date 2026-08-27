"use client";

import React, { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export interface EditTeacherRow {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  designation: string;
  department: string;
  status: "active" | "inactive";
  email: string;
  employeeId: string;
}

export interface EditTeacherModalProps {
  teacher: EditTeacherRow | null;
  onClose: () => void;
  onSubmit: (
    teacherId: string,
    fields: {
      firstName: string;
      lastName: string;
      phone?: string;
      designation: string;
      department: string;
      status: "active" | "inactive";
    }
  ) => Promise<unknown> | void;
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

export const EditTeacherModal: React.FC<EditTeacherModalProps> = ({
  teacher,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    designation: "",
    department: DEPARTMENTS[0],
    status: "active" as "active" | "inactive",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (teacher) {
      setForm({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone ?? "",
        designation: teacher.designation,
        department: teacher.department || DEPARTMENTS[0],
        status: teacher.status,
      });
    }
  }, [teacher]);

  const isValid = form.firstName && form.lastName && form.designation && form.department;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher || !isValid) return;
    setSaving(true);
    try {
      await onSubmit(teacher._id, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        designation: form.designation,
        department: form.department,
        status: form.status,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(teacher)}
      onClose={onClose}
      title="Edit Faculty Member"
      description={
        teacher ? `${teacher.employeeId} · ${teacher.email}` : "Update faculty details."
      }
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
            label="Designation *"
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
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </form>
    </Modal>
  );
};
