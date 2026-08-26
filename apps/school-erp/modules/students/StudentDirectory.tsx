"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  GraduationCap,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import { AddStudentModal } from "./AddStudentModal";

export interface StudentRecord {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  status: "active" | "inactive" | "transferred";
  attendanceRate?: number;
}

export const StudentDirectory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [students, setStudents] = useState<StudentRecord[]>([
    {
      id: "std-1",
      firstName: "Aiden",
      lastName: "Clark",
      rollNumber: "10-A-01",
      admissionNumber: "ADM-2026-101",
      className: "Grade 10",
      sectionName: "Section A",
      guardianName: "David Clark",
      guardianPhone: "+1 (555) 444-1101",
      guardianEmail: "dclark@example.com",
      status: "active",
      attendanceRate: 98,
    },
    {
      id: "std-2",
      firstName: "Sophia",
      lastName: "Martinez",
      rollNumber: "10-A-02",
      admissionNumber: "ADM-2026-102",
      className: "Grade 10",
      sectionName: "Section A",
      guardianName: "Elena Martinez",
      guardianPhone: "+1 (555) 444-1102",
      guardianEmail: "emartinez@example.com",
      status: "active",
      attendanceRate: 96,
    },
    {
      id: "std-3",
      firstName: "Ethan",
      lastName: "Wright",
      rollNumber: "10-A-03",
      admissionNumber: "ADM-2026-103",
      className: "Grade 10",
      sectionName: "Section A",
      guardianName: "Robert Wright",
      guardianPhone: "+1 (555) 444-1103",
      guardianEmail: "rwright@example.com",
      status: "active",
      attendanceRate: 92,
    },
    {
      id: "std-4",
      firstName: "Liam",
      lastName: "Chen",
      rollNumber: "10-A-04",
      admissionNumber: "ADM-2026-104",
      className: "Grade 10",
      sectionName: "Section A",
      guardianName: "Hui Chen",
      guardianPhone: "+1 (555) 444-1104",
      guardianEmail: "hchen@example.com",
      status: "active",
      attendanceRate: 94,
    },
    {
      id: "std-5",
      firstName: "Emma",
      lastName: "Davis",
      rollNumber: "10-A-05",
      admissionNumber: "ADM-2026-105",
      className: "Grade 10",
      sectionName: "Section A",
      guardianName: "Karen Davis",
      guardianPhone: "+1 (555) 444-1105",
      guardianEmail: "kdavis@example.com",
      status: "active",
      attendanceRate: 100,
    },
    {
      id: "std-6",
      firstName: "Oliver",
      lastName: "Brown",
      rollNumber: "09-A-01",
      admissionNumber: "ADM-2026-091",
      className: "Grade 9",
      sectionName: "Section A",
      guardianName: "George Brown",
      guardianPhone: "+1 (555) 444-1106",
      guardianEmail: "gbrown@example.com",
      status: "active",
      attendanceRate: 91,
    },
  ]);

  const handleAddStudent = (newStudent: any) => {
    const record: StudentRecord = {
      id: `std-${Date.now()}`,
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
      rollNumber: newStudent.rollNumber,
      admissionNumber: newStudent.admissionNumber,
      className: newStudent.classId === "c2" ? "Grade 9" : "Grade 10",
      sectionName: newStudent.sectionId === "s2" ? "Section B" : "Section A",
      guardianName: newStudent.guardianName,
      guardianPhone: newStudent.guardianPhone,
      guardianEmail: newStudent.guardianEmail,
      status: "active",
      attendanceRate: 100,
    };
    setStudents([record, ...students]);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.guardianName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      selectedClass === "all" || s.className === selectedClass;

    return matchesSearch && matchesClass;
  });

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
            placeholder="Search by student, roll no, guardian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="bg-slate-50 text-xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-40">
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={[
                { value: "all", label: "All Grades" },
                { value: "Grade 10", label: "Grade 10" },
                { value: "Grade 9", label: "Grade 9" },
              ]}
              className="text-xs py-1.5"
            />
          </div>

          <Badge variant="neutral" size="md">
            {filteredStudents.length} Students
          </Badge>
        </div>
      </div>

      {/* Student Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Roll Number</TableHead>
            <TableHead>Admission No</TableHead>
            <TableHead>Class & Section</TableHead>
            <TableHead>Guardian Contact</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents.map((student) => (
            <TableRow key={student.id}>
              {/* Student info */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar
                    name={`${student.firstName} ${student.lastName}`}
                    size="sm"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 leading-tight">
                      {student.firstName} {student.lastName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ID: {student.id}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/* Roll Number */}
              <TableCell>
                <Badge variant="neutral" size="sm" isMono>
                  {student.rollNumber}
                </Badge>
              </TableCell>

              {/* Admission Number */}
              <TableCell>
                <span className="text-xs font-mono-data text-slate-600">
                  {student.admissionNumber}
                </span>
              </TableCell>

              {/* Class & Section */}
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <span>{student.className}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">{student.sectionName}</span>
                </div>
              </TableCell>

              {/* Guardian Contact */}
              <TableCell>
                <div className="flex flex-col text-xs">
                  <span className="font-medium text-slate-800">
                    {student.guardianName}
                  </span>
                  <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {student.guardianPhone}
                  </span>
                </div>
              </TableCell>

              {/* Attendance */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full"
                      style={{ width: `${student.attendanceRate || 95}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono-data font-semibold text-slate-700">
                    {student.attendanceRate}%
                  </span>
                </div>
              </TableCell>

              {/* Status */}
              <TableCell>
                <Badge variant="success" size="sm" dot>
                  Active
                </Badge>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="xs"
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddStudent}
      />
    </div>
  );
};

