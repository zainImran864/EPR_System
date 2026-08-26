"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export interface AddStudentSubmit {
  firstName: string;
  lastName: string;
  admissionNumber: string;
  rollNumber: string;
  classId: string;
  sectionId: string;
  gender: "male" | "female" | "other";
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
}

export interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (student: AddStudentSubmit) => Promise<unknown> | void;
  /** Class options backed by real Convex ids. */
  classOptions: { value: string; label: string }[];
  /** Returns section options for a given class id. */
  getSections: (classId: string) => { value: string; label: string }[];
}

const emptyForm = {
  firstName: "",
  lastName: "",
  admissionNumber: "",
  rollNumber: "",
  classId: "",
  sectionId: "",
  gender: "male" as "male" | "female" | "other",
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
};

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  classOptions,
  getSections,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sectionOptions = formData.classId ? getSections(formData.classId) : [];

  const isValid =
    formData.firstName &&
    formData.lastName &&
    formData.rollNumber &&
    formData.admissionNumber &&
    formData.classId &&
    formData.sectionId &&
    formData.guardianName &&
    formData.guardianPhone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName: formData.firstName,
        lastName: formData.lastName,
        admissionNumber: formData.admissionNumber,
        rollNumber: formData.rollNumber,
        classId: formData.classId,
        sectionId: formData.sectionId,
        gender: formData.gender,
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone,
        guardianEmail: formData.guardianEmail || undefined,
      });
      setFormData(emptyForm);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll New Student"
      description="Register a student to an active academic class and allocate roll number."
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
            label="Admission No *"
            placeholder="e.g. ADM-2026-020"
            value={formData.admissionNumber}
            onChange={(e) =>
              setFormData({ ...formData, admissionNumber: e.target.value })
            }
            required
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

        <div className="pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Guardian Contact Information
          </span>
        </div>

        {/* Guardian Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <Input
            label="Guardian Email"
            type="email"
            placeholder="e.g. hchen@example.com"
            value={formData.guardianEmail}
            onChange={(e) =>
              setFormData({ ...formData, guardianEmail: e.target.value })
            }
          />
        </div>
      </form>
    </Modal>
  );
};
