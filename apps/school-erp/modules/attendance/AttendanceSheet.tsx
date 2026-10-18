"use client";

import React, { useState } from "react";
import { CalendarCheck, Save } from "lucide-react";
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
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAttendance } from "@/app/hooks/useAttendance";
import { useClasses } from "@/app/hooks/useClasses";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export const AttendanceSheet: React.FC = () => {
  const {
    selectedDate,
    selectedClassId,
    selectedSectionId,
    roster,
    summary,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    setSelectedDate,
    setSelectedClass,
    setSelectedSection,
    updateStatus,
    markAll,
    updateRemarks,
    saveRoster,
  } = useAttendance();

  const { classOptions, sectionOptions } = useClasses();

  // Brief "saved" flash — cleared when the user makes a new edit (hasUnsavedChanges will flip true)
  const [savedFlash, setSavedFlash] = useState(false);

  const handleSave = async () => {
    const ok = await saveRoster();
    if (ok) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 3000);
    }
  };

  const noSelection = !selectedClassId || !selectedSectionId;
  const presentPct = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;
  const latePct = summary.total > 0 ? Math.round((summary.late / summary.total) * 100) : 0;
  const absentPct = summary.total > 0 ? Math.round((summary.absent / summary.total) * 100) : 0;
  const excusedPct = summary.total > 0 ? Math.round((summary.excused / summary.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" aria-hidden="true" />
            Daily Attendance Sheet
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record, verify, and lock session attendance by class and section
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {hasUnsavedChanges && (
            <Badge variant="warning" size="sm" dot>
              Unsaved changes
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll("present")}
            className="text-xs"
            disabled={noSelection || isLoading}
          >
            Mark All Present
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            leftIcon={<Save className="w-4 h-4" aria-hidden="true" />}
            isLoading={isSaving}
            disabled={noSelection || isLoading || isSaving}
            className="text-xs"
          >
            {savedFlash && !hasUnsavedChanges ? "Saved & Synced!" : "Save Attendance"}
          </Button>
        </div>
      </div>

      {/* Selector Toolbar & Live Summary Pills */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto">
            <div>
              <label className="sr-only" htmlFor="attendance-date">Date</label>
              <input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-50 text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                value={selectedClassId}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={[
                  { value: "", label: "Select class" },
                  ...classOptions,
                ]}
                className="text-xs py-1.5 w-full"
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                value={selectedSectionId}
                onChange={(e) => setSelectedSection(e.target.value)}
                options={[
                  { value: "", label: "Select section" },
                  ...(selectedClassId ? sectionOptions(selectedClassId) : []),
                ]}
                disabled={!selectedClassId}
                className="text-xs py-1.5 w-full"
              />
            </div>
          </div>

          {/* Live counters — always visible so the toolbar layout stays stable */}
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

        {/* Visual Attendance Breakdown Progress Bar */}
        {!noSelection && summary.total > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
              <span className="font-medium text-slate-700">
                Session Attendance Rate:{" "}
                <strong className="font-mono-data text-slate-900">{presentPct + latePct}%</strong>
              </span>
              <span className="font-mono-data">
                {summary.present + summary.late} / {summary.total} attending
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
              {presentPct > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-300"
                  style={{ width: `${presentPct}%` }}
                  title={`Present: ${presentPct}%`}
                />
              )}
              {latePct > 0 && (
                <div
                  className="bg-amber-500 transition-all duration-300"
                  style={{ width: `${latePct}%` }}
                  title={`Late: ${latePct}%`}
                />
              )}
              {excusedPct > 0 && (
                <div
                  className="bg-sky-500 transition-all duration-300"
                  style={{ width: `${excusedPct}%` }}
                  title={`Excused: ${excusedPct}%`}
                />
              )}
              {absentPct > 0 && (
                <div
                  className="bg-rose-500 transition-all duration-300"
                  style={{ width: `${absentPct}%` }}
                  title={`Absent: ${absentPct}%`}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Body — four states */}
      {noSelection ? (
        <EmptyState
          icon={<CalendarCheck className="w-6 h-6" aria-hidden="true" />}
          title="Pick a class & section"
          description="Use the toolbar above to select a class and section, then choose a date to load the attendance roster."
        />
      ) : isLoading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : roster.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="w-6 h-6" aria-hidden="true" />}
          title="No students in this section"
          description="This section has no enrolled students yet. Add students via the Students module."
        />
      ) : (
        <>
          {/* Mobile Touch Card List (< 768px) */}
          <div className="md:hidden space-y-3">
            {roster.map((row, idx) => {
              const fullName = `${row.firstName} ${row.lastName}`;
              return (
                <div
                  key={row.studentId}
                  className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={fullName} size="xs" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">
                          {fullName}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500">
                          Roll #{row.rollNumber}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        row.status === "present"
                          ? "success"
                          : row.status === "absent"
                            ? "danger"
                            : row.status === "late"
                              ? "warning"
                              : "info"
                      }
                      size="sm"
                    >
                      {row.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div
                    role="group"
                    aria-label={`Mobile attendance status for ${fullName}`}
                    className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => updateStatus(idx, "present")}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        row.status === "present"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(idx, "absent")}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        row.status === "absent"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(idx, "late")}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        row.status === "late"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Late
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(idx, "excused")}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        row.status === "excused"
                          ? "bg-sky-600 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Excused
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Add attendance remark / note..."
                    value={row.remarks ?? ""}
                    onChange={(e) => updateRemarks(idx, e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-teal-600"
                  />
                </div>
              );
            })}
          </div>

          {/* Desktop Table (>= 768px) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((row, idx) => {
                  const fullName = `${row.firstName} ${row.lastName}`;
                  return (
                    <TableRow key={row.studentId}>
                      <TableCell>
                        <Badge variant="neutral" size="sm" isMono>
                          {row.rollNumber}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={fullName} size="xs" />
                          <span className="font-semibold text-slate-800 text-sm">
                            {fullName}
                          </span>
                        </div>
                      </TableCell>

                      {/* P / A / L / E toggle pill */}
                      <TableCell className="text-center">
                        <div
                          role="group"
                          aria-label={`Attendance status for ${fullName}`}
                          className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1 border border-slate-200"
                        >
                          <button
                            type="button"
                            aria-label="Present"
                            aria-pressed={row.status === "present"}
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
                            aria-label="Absent"
                            aria-pressed={row.status === "absent"}
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
                            aria-label="Late"
                            aria-pressed={row.status === "late"}
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
                            aria-label="Excused"
                            aria-pressed={row.status === "excused"}
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
                        <label className="sr-only" htmlFor={`remarks-${row.studentId}`}>
                          Remarks for {fullName}
                        </label>
                        <input
                          id={`remarks-${row.studentId}`}
                          type="text"
                          placeholder="Add note..."
                          value={row.remarks ?? ""}
                          onChange={(e) => updateRemarks(idx, e.target.value)}
                          className="bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border focus:border-slate-300 px-2 py-1 rounded w-full max-w-xs"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};
