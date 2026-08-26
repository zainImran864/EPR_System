"use client";

import React, { useState } from "react";
import {
  CalendarCheck,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Avatar } from "@/components/ui/Avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/Table";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceStudentRow {
  studentId: string;
  name: string;
  rollNumber: string;
  status: AttendanceStatus;
  remarks?: string;
}

export const AttendanceSheet: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedClass, setSelectedClass] = useState("cls-10");
  const [selectedSection, setSelectedSection] = useState("sec-10a");
  const [isSaved, setIsSaved] = useState(false);

  const [roster, setRoster] = useState<AttendanceStudentRow[]>([
    {
      studentId: "s1",
      name: "Aiden Clark",
      rollNumber: "10-A-01",
      status: "present",
    },
    {
      studentId: "s2",
      name: "Sophia Martinez",
      rollNumber: "10-A-02",
      status: "present",
    },
    {
      studentId: "s3",
      name: "Ethan Wright",
      rollNumber: "10-A-03",
      status: "present",
    },
    {
      studentId: "s4",
      name: "Liam Chen",
      rollNumber: "10-A-04",
      status: "late",
      remarks: "15 min bus delay",
    },
    {
      studentId: "s5",
      name: "Emma Davis",
      rollNumber: "10-A-05",
      status: "present",
    },
  ]);

  const updateStatus = (index: number, status: AttendanceStatus) => {
    const updated = [...roster];
    updated[index].status = status;
    setRoster(updated);
    setIsSaved(false);
  };

  const markAll = (status: AttendanceStatus) => {
    const updated = roster.map((r) => ({ ...r, status }));
    setRoster(updated);
    setIsSaved(false);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const summary = {
    total: roster.length,
    present: roster.filter((r) => r.status === "present").length,
    absent: roster.filter((r) => r.status === "absent").length,
    late: roster.filter((r) => r.status === "late").length,
    excused: roster.filter((r) => r.status === "excused").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#0D9488]" />
            Daily Attendance Sheet
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record, verify, and lock session attendance by class and section
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll("present")}
            className="text-xs"
          >
            Mark All Present
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            leftIcon={<Save className="w-4 h-4" />}
            className="text-xs"
          >
            {isSaved ? "Saved & Synced!" : "Save Attendance"}
          </Button>
        </div>
      </div>

      {/* Selector Toolbar & Live Summary Pills */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-50 text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-[#0D9488]"
          />

          <div className="w-36">
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={[
                { value: "cls-10", label: "Grade 10" },
                { value: "cls-9", label: "Grade 9" },
              ]}
              className="text-xs py-1.5"
            />
          </div>

          <div className="w-36">
            <Select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              options={[
                { value: "sec-10a", label: "Section A" },
                { value: "sec-10b", label: "Section B" },
              ]}
              className="text-xs py-1.5"
            />
          </div>
        </div>

        {/* Real-time counters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="success" size="sm" isMono>
            {summary.present} Present
          </Badge>
          <Badge variant="danger" size="sm" isMono>
            {summary.absent} Absent
          </Badge>
          <Badge variant="warning" size="sm" isMono>
            {summary.late} Late
          </Badge>
          <Badge variant="info" size="sm" isMono>
            {summary.excused} Excused
          </Badge>
          <Badge variant="neutral" size="sm" isMono>
            Total: {summary.total}
          </Badge>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Roll No</TableHead>
            <TableHead>Student</TableHead>
            <TableHead className="text-center">Status Toggle</TableHead>
            <TableHead>Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roster.map((row, idx) => (
            <TableRow key={row.studentId}>
              <TableCell>
                <Badge variant="neutral" size="sm" isMono>
                  {row.rollNumber}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar name={row.name} size="xs" />
                  <span className="font-semibold text-slate-800 text-sm">
                    {row.name}
                  </span>
                </div>
              </TableCell>

              {/* Status Action Buttons */}
              <TableCell className="text-center">
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => updateStatus(idx, "present")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      row.status === "present"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(idx, "absent")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      row.status === "absent"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(idx, "late")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      row.status === "late"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    L
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(idx, "excused")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      row.status === "excused"
                        ? "bg-sky-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    E
                  </button>
                </div>
              </TableCell>

              <TableCell>
                <input
                  type="text"
                  placeholder="Add note..."
                  value={row.remarks || ""}
                  onChange={(e) => {
                    const updated = [...roster];
                    updated[idx].remarks = e.target.value;
                    setRoster(updated);
                  }}
                  className="bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border focus:border-slate-300 px-2 py-1 rounded w-full max-w-xs"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

