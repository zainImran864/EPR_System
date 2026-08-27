"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Download,
  GraduationCap,
  Phone,
  Power,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Pagination } from "@/components/ui/Pagination";
import { AddStudentModal } from "./AddStudentModal";
import { EditStudentModal, type EditStudentRow } from "./EditStudentModal";
import { useStudents } from "@/app/hooks/useStudents";
import { useClasses } from "@/app/hooks/useClasses";
import { useActiveSchool } from "@/app/hooks/useActiveSchool";
import { useToast } from "@/app/hooks/useToast";
import { exportToExcel } from "@/app/lib/exportExcel";

type StudentRow = {
  _id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  admissionNumber: string;
  className?: string;
  sectionName?: string;
  guardianName: string;
  guardianPhone: string;
  status: "active" | "inactive" | "transferred";
};

export const StudentDirectory: React.FC = () => {
  const {
    students,
    allStudents,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    filters,
    isLoading,
    addStudent,
    editStudent,
    setStudentStatus,
    removeStudent,
    setFilters,
    setCurrentPage,
    setPageSize,
  } = useStudents();

  const { classOptions, sectionOptions } = useClasses();
  const { school } = useActiveSchool();
  const { success, error } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditStudentRow | null>(null);

  const handleExport = () =>
    exportToExcel(
      allStudents.map((s) => ({
        Name: `${s.firstName} ${s.lastName}`,
        Roll: s.rollNumber,
        Admission: s.admissionNumber,
        Class: s.className ?? "",
        Section: s.sectionName ?? "",
        Guardian: s.guardianName,
        Phone: s.guardianPhone,
        Status: s.status,
      })),
      [
        { key: "Name", label: "Student Name", width: 26 },
        { key: "Roll", label: "Roll No", width: 14 },
        { key: "Admission", label: "Admission No", width: 18 },
        { key: "Class", label: "Class", width: 14 },
        { key: "Section", label: "Section", width: 14 },
        { key: "Guardian", label: "Guardian", width: 22 },
        { key: "Phone", label: "Guardian Phone", width: 18 },
        { key: "Status", label: "Status", width: 12 },
      ],
      "students",
      {
        schoolName: school?.name ?? "School",
        schoolCode: school?.code,
        address: school?.address,
        logoUrl: school?.logoUrl,
        title: "Student Directory",
      }
    );

  const columns: Column<StudentRow>[] = [
    {
      key: "name",
      header: "Student Name",
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${s.firstName} ${s.lastName}`} size="sm" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">
              {s.firstName} {s.lastName}
            </span>
            <span className="text-[11px] text-slate-400 font-mono-data">
              {s.admissionNumber}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "rollNumber",
      header: "Roll No",
      render: (s) => (
        <Badge variant="neutral" size="sm" isMono>
          {s.rollNumber}
        </Badge>
      ),
    },
    {
      key: "class",
      header: "Class & Section",
      render: (s) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <span>{s.className}</span>
          {s.sectionName && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{s.sectionName}</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: "guardian",
      header: "Guardian Contact",
      render: (s) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-slate-800">{s.guardianName}</span>
          <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" />
            {s.guardianPhone}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <Badge
          variant={
            s.status === "active"
              ? "success"
              : s.status === "transferred"
              ? "info"
              : "neutral"
          }
          size="sm"
          dot
        >
          {s.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setEditing(s as unknown as EditStudentRow)}
            title="Edit"
            className="p-1 text-slate-400 hover:text-[#0D9488]"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() =>
              setStudentStatus(s._id, s.status === "active" ? "inactive" : "active")
            }
            title={s.status === "active" ? "Deactivate" : "Activate"}
            className="p-1 text-slate-400 hover:text-slate-700"
          >
            <Power className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => handleDelete(s)}
            title="Delete student"
            className="p-1 text-slate-400 hover:text-rose-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = async (studentId: string, fields: Record<string, unknown>) => {
    try {
      await editStudent(studentId, fields);
      success("Student details updated.");
    } catch {
      error("Could not update student.");
      throw new Error("update failed");
    }
  };

  const handleDelete = async (s: StudentRow) => {
    if (
      !window.confirm(
        `Delete ${s.firstName} ${s.lastName}? This permanently removes their profile and login (plus the linked guardian login) — they will lose dashboard access.`
      )
    )
      return;
    try {
      await removeStudent(s._id);
      success("Student deleted.");
    } catch {
      error("Could not delete student.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#0D9488]" />
            Student Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage student registrations, guardian details, and enrollment status
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExport}
            disabled={!allStudents.length}
            className="text-xs"
          >
            Export Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs"
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by name, roll no, admission, guardian..."
            value={filters.search ?? ""}
            onChange={(e) => setFilters({ search: e.target.value })}
            leftIcon={<Search className="w-4 h-4" />}
            className="bg-slate-50 text-xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-44">
            <Select
              value={filters.classId ?? ""}
              onChange={(e) => setFilters({ classId: e.target.value || undefined })}
              options={[{ value: "", label: "All Grades" }, ...classOptions]}
              className="text-xs py-1.5"
            />
          </div>
          <div className="w-40">
            <Select
              value={filters.status ?? ""}
              onChange={(e) =>
                setFilters({
                  status: (e.target.value || undefined) as StudentRow["status"] | undefined,
                })
              }
              options={[
                { value: "", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "transferred", label: "Transferred" },
              ]}
              className="text-xs py-1.5"
            />
          </div>
          <Badge variant="neutral" size="md">
            {totalItems} Students
          </Badge>
        </div>
      </div>

      {/* Student Grid */}
      <DataGrid<StudentRow>
        columns={columns}
        data={students as StudentRow[]}
        rowKey={(s) => s._id}
        isLoading={isLoading}
        emptyIcon={<GraduationCap className="w-6 h-6" />}
        emptyTitle="No students found"
        emptyDescription="Try adjusting filters, seed demo data, or enroll a new student."
        emptyAction={
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            Add Student
          </Button>
        }
      />

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="students"
        />
      )}

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={addStudent}
        classOptions={classOptions}
        getSections={sectionOptions}
        schoolCode={school?.code}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        student={editing}
        onClose={() => setEditing(null)}
        onSubmit={handleEdit}
        classOptions={classOptions}
        getSections={sectionOptions}
      />
    </div>
  );
};
