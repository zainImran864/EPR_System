"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Download,
  GraduationCap,
  Phone,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Pagination } from "@/components/ui/Pagination";
import { AddStudentModal } from "./AddStudentModal";
import { useStudents } from "@/app/hooks/useStudents";
import { useClasses } from "@/app/hooks/useClasses";
import { exportToCSV } from "@/app/lib/export";

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
    setStudentStatus,
    setFilters,
    setCurrentPage,
    setPageSize,
  } = useStudents();

  const { classOptions, sectionOptions } = useClasses();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleExport = () => {
    exportToCSV(
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
      "students"
    );
  };

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
      ),
    },
  ];

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
            Export CSV
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
      />
    </div>
  );
};
