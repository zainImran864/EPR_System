"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (student: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    rollNumber: string;
    classId?: string;
    sectionId?: string;
    gender: "male" | "female" | "other";
    guardianName: string;
    guardianPhone: string;
    guardianEmail?: string;
  }) => void;
  classes?: Array<{ id: string; name: string }>;
  sections?: Array<{ id: string; name: string }>;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  classes = [
    { id: "c1", name: "Grade 10" },
    { id: "c2", name: "Grade 9" },
    { id: "c3", name: "Grade 8" },
  ],
  sections = [
    { id: "s1", name: "Section A" },
    { id: "s2", name: "Section B" },
  ],
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    admissionNumber: `ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
    rollNumber: "",
    classId: classes[0]?.id || "",
    sectionId: sections[0]?.id || "",
    gender: "male" as "male" | "female" | "other",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.rollNumber) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(formData);
      setIsSubmitting(false);
      onClose();
    }, 400);
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
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />
          <Input
            label="Last Name *"
            placeholder="e.g. Chen"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />
        </div>

        {/* Academic Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Admission No *"
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
            onChange={(e) =>
              setFormData({ ...formData, rollNumber: e.target.value })
            }
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
            onChange={(e) =>
              setFormData({ ...formData, classId: e.target.value })
            }
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            label="Section *"
            value={formData.sectionId}
            onChange={(e) =>
              setFormData({ ...formData, sectionId: e.target.value })
            }
            options={sections.map((s) => ({ value: s.id, label: s.name }))}
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
