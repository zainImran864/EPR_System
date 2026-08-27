"use client";

import React, { useState } from "react";
import { Search, Plus, Download, Users, Mail, Power, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { AddTeacherModal } from "./AddTeacherModal";
import { useTeachers } from "@/app/hooks/useTeachers";
import { useActiveSchool } from "@/app/hooks/useActiveSchool";
import { useToast } from "@/app/hooks/useToast";
import { exportToExcel } from "@/app/lib/exportExcel";

type TeacherRow = {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone?: string;
  designation: string;
  department: string;
  status: "active" | "inactive";
};

export const StaffDirectory: React.FC = () => {
  const {
    teachers,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    addTeacher,
    setTeacherStatus,
  } = useTeachers();
  const { school } = useActiveSchool();
  const { success, error } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const rows = teachers as TeacherRow[];

  const handleExport = () =>
    exportToExcel(
      rows.map((t) => ({
        Name: `${t.firstName} ${t.lastName}`,
        EmployeeID: t.employeeId,
        Email: t.email,
        Designation: t.designation,
        Department: t.department,
        Phone: t.phone ?? "",
        Status: t.status,
      })),
      [
        { key: "Name", label: "Faculty Name", width: 26 },
        { key: "EmployeeID", label: "Employee ID", width: 16 },
        { key: "Email", label: "Login Email", width: 30 },
        { key: "Designation", label: "Designation", width: 22 },
        { key: "Department", label: "Department", width: 20 },
        { key: "Phone", label: "Phone", width: 18 },
        { key: "Status", label: "Status", width: 12 },
      ],
      "staff",
      {
        schoolName: school?.name ?? "School",
        schoolCode: school?.code,
        address: school?.address,
        logoUrl: school?.logoUrl,
        title: "Faculty & Staff Directory",
      }
    );

  const handleAdd = async (t: Parameters<typeof addTeacher>[0]) => {
    try {
      const res = await addTeacher(t);
      const email = (res as { email?: string } | undefined)?.email;
      success(email ? `Faculty added — login: ${email}` : "Faculty member added.");
    } catch (err) {
      console.error(err);
      error("Could not add faculty member.");
      throw err;
    }
  };

  const columns: Column<TeacherRow>[] = [
    {
      key: "name",
      header: "Faculty Member",
      render: (t) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${t.firstName} ${t.lastName}`} size="sm" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">
              {t.firstName} {t.lastName}
            </span>
            <span className="text-[11px] text-slate-400 font-mono-data">
              {t.employeeId}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Login Email",
      render: (t) => (
        <span className="flex items-center gap-1.5 text-xs text-slate-600 font-mono-data">
          <Mail className="w-3 h-3 text-slate-400" />
          {t.email}
        </span>
      ),
    },
    {
      key: "role",
      header: "Designation",
      render: (t) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-slate-800">{t.designation}</span>
          <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
            <Briefcase className="w-3 h-3 text-slate-400" />
            {t.department}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <Badge variant={t.status === "active" ? "success" : "neutral"} size="sm" dot>
          {t.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (t) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={() =>
            setTeacherStatus(t._id, t.status === "active" ? "inactive" : "active")
          }
          title={t.status === "active" ? "Deactivate login" : "Activate login"}
          className="p-1 text-slate-400 hover:text-slate-700"
        >
          <Power className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0D9488]" />
            Faculty & Staff Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage teaching staff and provision their portal logins
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExport}
            disabled={!rows.length}
            className="text-xs"
          >
            Export Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddOpen(true)}
            className="text-xs"
          >
            Add Faculty
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by name, employee ID, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="bg-slate-50 text-xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-40">
            <Select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "active" | "inactive" | "all")
              }
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              className="text-xs py-1.5"
            />
          </div>
          <Badge variant="neutral" size="md">
            {rows.length} Staff
          </Badge>
        </div>
      </div>

      {/* Grid */}
      <DataGrid<TeacherRow>
        columns={columns}
        data={rows}
        rowKey={(t) => t._id}
        isLoading={isLoading}
        emptyIcon={<Users className="w-6 h-6" />}
        emptyTitle="No faculty found"
        emptyDescription="Add your first faculty member to provision their login."
        emptyAction={
          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
            Add Faculty
          </Button>
        }
      />

      {/* Add Modal */}
      <AddTeacherModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAdd}
        schoolCode={school?.code}
      />
    </div>
  );
};
