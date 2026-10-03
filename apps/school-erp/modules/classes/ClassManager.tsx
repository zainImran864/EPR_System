"use client";

import React, { useState } from "react";
import { BookOpen, Plus, DoorClosed, Pencil, UserCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useClasses } from "@/app/hooks/useClasses";
import { useTeachers } from "@/app/hooks/useTeachers";

// ---------------------------------------------------------------------------
// Types inferred from the hook's return shape
// ---------------------------------------------------------------------------

interface Section {
  _id: string;
  name: string;
  roomNumber?: string;
  room?: string;
  classTeacherId?: string | null;
  classTeacher?: {
    id: string;
    fullName: string;
    email?: string;
    specialization?: string;
  } | null;
  studentCount: number;
}

interface ClassRecord {
  _id: string;
  name: string;
  numericGrade: number;
  academicYear: string;
  totalStudents: number;
  sections: Section[];
}

// ---------------------------------------------------------------------------
// Card-shaped loading skeleton — two cards matching the real layout
// ---------------------------------------------------------------------------

const ClassCardSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="bg-slate-50/60 flex-row items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </CardHeader>
    <CardContent className="p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-slate-200/80 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// Per-section card (showing section name, room, assigned teacher + count)
// ---------------------------------------------------------------------------

const SectionCard: React.FC<{ section: Section; onEdit: () => void }> = ({
  section,
  onEdit,
}) => {
  const room = section.roomNumber || section.room;
  const teacherName = section.classTeacher?.fullName;

  return (
    <div className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-[#0D9488]/40 hover:shadow-xs transition-all duration-150 flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-slate-900">{section.name}</span>
        <div className="flex items-center gap-2">
          {room && (
            <span className="text-xs text-slate-500 flex items-center gap-1 font-mono-data">
              <DoorClosed className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              {room}
            </span>
          )}
          <button
            onClick={onEdit}
            title="Edit section"
            className="p-1 rounded text-slate-400 hover:text-[#0D9488] hover:bg-slate-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-700 min-w-0 pr-2">
          <UserCheck
            className={`w-3.5 h-3.5 shrink-0 ${
              teacherName || section.classTeacherId ? "text-[#0D9488]" : "text-slate-300"
            }`}
          />
          <span className="truncate font-medium text-[11px]">
            {teacherName || (section.classTeacherId ? "Teacher assigned" : "No teacher assigned")}
          </span>
        </div>
        <Badge variant="info" size="sm" isMono className="shrink-0">
          {section.studentCount} enrolled
        </Badge>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Add Section modal (with Class Teacher dropdown)
// ---------------------------------------------------------------------------

interface AddSectionModalProps {
  classId: string;
  className: string;
  isOpen: boolean;
  onClose: () => void;
  teacherOptions: { value: string; label: string }[];
  addSection: (args: {
    classId: string;
    name: string;
    roomNumber?: string;
    classTeacherId?: string;
  }) => Promise<unknown> | undefined;
}

const AddSectionModal: React.FC<AddSectionModalProps> = ({
  classId,
  className,
  isOpen,
  onClose,
  teacherOptions,
  addSection,
}) => {
  const [sectionName, setSectionName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [classTeacherId, setClassTeacherId] = useState("");

  const handleClose = () => {
    setSectionName("");
    setRoomNumber("");
    setClassTeacherId("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!sectionName.trim()) return;
    await addSection({
      classId,
      name: sectionName.trim(),
      roomNumber: roomNumber.trim() || undefined,
      classTeacherId: classTeacherId || undefined,
    });
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add Section — ${className}`}
      description="Create a new section and assign an in-charge class teacher."
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!sectionName.trim()}
          >
            Add Section
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Section Name *"
          placeholder="e.g. Section B or Rose"
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
        />
        <Input
          label="Room Number"
          placeholder="e.g. Room 305"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
        />
        <Select
          label="Class Teacher (In-Charge)"
          placeholder="Select an available faculty member..."
          value={classTeacherId}
          onChange={(e) => setClassTeacherId(e.target.value)}
          options={[
            { value: "", label: "-- None / Assign Later --" },
            ...teacherOptions,
          ]}
        />
      </div>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Per-class card with inline "Add Section" affordance
// ---------------------------------------------------------------------------

interface ClassCardProps {
  cls: ClassRecord;
  teacherOptions: { value: string; label: string }[];
  addSection: AddSectionModalProps["addSection"];
  editClass: (
    classId: string,
    fields: { name?: string; numericGrade?: number }
  ) => Promise<unknown> | undefined;
  editSection: (
    sectionId: string,
    fields: { name?: string; roomNumber?: string; classTeacherId?: string | null }
  ) => Promise<unknown> | undefined;
}

const ClassCard: React.FC<ClassCardProps> = ({
  cls,
  teacherOptions,
  addSection,
  editClass,
  editSection,
}) => {
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(false);
  const [editSectionTarget, setEditSectionTarget] = useState<Section | null>(null);

  const [clsForm, setClsForm] = useState({ name: cls.name, grade: String(cls.numericGrade) });
  const [secForm, setSecForm] = useState({ name: "", roomNumber: "", classTeacherId: "" });

  const openClassEdit = () => {
    setClsForm({ name: cls.name, grade: String(cls.numericGrade) });
    setEditingClass(true);
  };
  const openSectionEdit = (sec: Section) => {
    setSecForm({
      name: sec.name,
      roomNumber: sec.roomNumber || sec.room || "",
      classTeacherId: sec.classTeacherId || sec.classTeacher?.id || "",
    });
    setEditSectionTarget(sec);
  };

  const saveClass = async () => {
    if (!clsForm.name.trim()) return;
    await editClass(cls._id, {
      name: clsForm.name.trim(),
      numericGrade: parseInt(clsForm.grade) || cls.numericGrade,
    });
    setEditingClass(false);
  };

  const saveSection = async () => {
    if (!editSectionTarget || !secForm.name.trim()) return;
    await editSection(editSectionTarget._id, {
      name: secForm.name.trim(),
      roomNumber: secForm.roomNumber.trim() || undefined,
      classTeacherId: secForm.classTeacherId || null,
    });
    setEditSectionTarget(null);
  };

  return (
    <>
      <Card key={cls._id}>
        <CardHeader className="bg-slate-50/60 flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg bg-[#CCFBF1] text-[#0D9488] flex items-center justify-center font-bold text-sm"
              aria-hidden="true"
            >
              {cls.numericGrade}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-1.5">
                {cls.name}
                <button
                  onClick={openClassEdit}
                  title="Edit class"
                  className="p-0.5 rounded text-slate-400 hover:text-[#0D9488]"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </CardTitle>
              <span className="text-xs text-slate-500">
                Session: {cls.academicYear}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="primary" size="sm" isMono>
              {cls.totalStudents} Students
            </Badge>
            <Badge variant="neutral" size="sm">
              {cls.sections.length} Sections
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Add section to ${cls.name}`}
              leftIcon={<Plus className="w-3.5 h-3.5" aria-hidden="true" />}
              onClick={() => setIsSectionModalOpen(true)}
              className="text-xs"
            >
              Add Section
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {cls.sections.length === 0 ? (
            <p className="text-sm text-slate-400 italic">
              No sections yet — use "Add Section" to create one.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cls.sections.map((sec) => (
                <SectionCard
                  key={sec._id}
                  section={sec}
                  onEdit={() => openSectionEdit(sec)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddSectionModal
        classId={cls._id}
        className={cls.name}
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        teacherOptions={teacherOptions}
        addSection={addSection}
      />

      {/* Edit Class */}
      <Modal
        isOpen={editingClass}
        onClose={() => setEditingClass(false)}
        title={`Edit ${cls.name}`}
        description="Update the class name and grade level."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditingClass(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveClass}
              disabled={!clsForm.name.trim()}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Class / Grade Name *"
            value={clsForm.name}
            onChange={(e) => setClsForm({ ...clsForm, name: e.target.value })}
          />
          <Input
            label="Numeric Grade Level *"
            type="number"
            min={0}
            value={clsForm.grade}
            onChange={(e) => setClsForm({ ...clsForm, grade: e.target.value })}
          />
        </div>
      </Modal>

      {/* Edit Section */}
      <Modal
        isOpen={Boolean(editSectionTarget)}
        onClose={() => setEditSectionTarget(null)}
        title="Edit Section"
        description="Rename the section, change its room, or update the in-charge class teacher."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditSectionTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveSection}
              disabled={!secForm.name.trim()}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Section Name *"
            value={secForm.name}
            onChange={(e) => setSecForm({ ...secForm, name: e.target.value })}
          />
          <Input
            label="Room Number"
            value={secForm.roomNumber}
            onChange={(e) => setSecForm({ ...secForm, roomNumber: e.target.value })}
          />
          <Select
            label="Class Teacher (In-Charge)"
            placeholder="Select an available faculty member..."
            value={secForm.classTeacherId}
            onChange={(e) => setSecForm({ ...secForm, classTeacherId: e.target.value })}
            options={[
              { value: "", label: "-- None / Unassign --" },
              ...teacherOptions,
            ]}
          />
        </div>
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const ClassManager: React.FC = () => {
  const { classes, isLoading, addClass, addSection, editClass, editSection } =
    useClasses();
  const { teachers } = useTeachers();

  const teacherOptions = React.useMemo(() => {
    return (teachers || []).map((t: any) => ({
      value: t._id || t.id,
      label: `${t.fullName} (${t.department || t.specialization || "Faculty"})`,
    }));
  }, [teachers]);

  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("");

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    await addClass({
      name: newClassName.trim(),
      numericGrade: parseInt(newClassGrade) || 1,
      academicYear: "2026-2027",
      sections: ["Section A"],
    });
    setNewClassName("");
    setNewClassGrade("");
    setIsAddClassOpen(false);
  };

  const handleCloseAddClass = () => {
    setNewClassName("");
    setNewClassGrade("");
    setIsAddClassOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0D9488]" aria-hidden="true" />
            Academic Classes &amp; Sections
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize grades, allocate section rooms, and assign faculty leads
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
          onClick={() => setIsAddClassOpen(true)}
          className="text-xs"
        >
          Add New Class
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6" aria-busy="true" aria-label="Loading classes">
          <ClassCardSkeleton />
          <ClassCardSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && classes.length === 0 && (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" aria-hidden="true" />}
          title="No classes yet"
          description="No academic classes have been created for this school. Add your first class to get started, or seed the database with sample data."
          action={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
              onClick={() => setIsAddClassOpen(true)}
            >
              Add New Class
            </Button>
          }
        />
      )}

      {/* Data state */}
      {!isLoading && classes.length > 0 && (
        <div className="space-y-6">
          {(classes as ClassRecord[]).map((cls) => (
            <ClassCard
              key={cls._id}
              cls={cls}
              teacherOptions={teacherOptions}
              addSection={addSection}
              editClass={editClass}
              editSection={editSection}
            />
          ))}
        </div>
      )}

      {/* Add Class Modal */}
      <Modal
        isOpen={isAddClassOpen}
        onClose={handleCloseAddClass}
        title="Create New Academic Grade / Class"
        description="Add a new class to your institution curriculum."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={handleCloseAddClass}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateClass}
              disabled={!newClassName.trim()}
            >
              Create Class
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Class / Grade Name *"
            placeholder="e.g. Grade 11"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
          <Input
            label="Numeric Grade Level *"
            type="number"
            placeholder="e.g. 11"
            value={newClassGrade}
            onChange={(e) => setNewClassGrade(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
