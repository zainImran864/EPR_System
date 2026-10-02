"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ChevronRight as Arrow,
} from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { attendanceApi } from "@/app/api/attendance";
import { useClasses } from "@/app/hooks/useClasses";
import { useActiveSchool } from "@/app/hooks/useActiveSchool";

const STATUS_COLOR: Record<string, string> = {
  present: "bg-emerald-500 text-white",
  absent: "bg-rose-500 text-white",
  late: "bg-amber-500 text-white",
  excused: "bg-sky-500 text-white",
};
const STATUS_DOT: Record<string, string> = {
  present: "bg-emerald-500",
  absent: "bg-rose-500",
  late: "bg-amber-500",
  excused: "bg-sky-500",
};
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Month calendar for one student's attendance. */
const AttendanceCalendar: React.FC<{ studentId: string }> = ({ studentId }) => {
  const { schoolId } = useActiveSchool();
  const data = useQuery(
    attendanceApi.studentAttendance,
    schoolId ? { schoolId, studentId: studentId as Id<"students"> } : "skip"
  );

  const byDate = useMemo(() => {
    const m = new Map<string, string>();
    (data?.records ?? []).forEach((r) => m.set(r.date, r.status));
    return m;
  }, [data]);

  // Start on the month of the most recent record, else today.
  const initial = data?.records?.[0]?.date;
  const [cursor, setCursor] = useState(() => {
    const d = initial ? new Date(initial) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const shift = (delta: number) => {
    setCursor((c) => {
      const m = c.month + delta;
      return { year: c.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  };

  const s = data?.summary;

  return (
    <div className="space-y-4">
      {s && s.total > 0 && (
        <div className="grid grid-cols-5 gap-2 text-center">
          <Tile label="Rate" value={`${s.presentRate ?? 0}%`} accent />
          <Tile label="Present" value={s.present} />
          <Tile label="Absent" value={s.absent} />
          <Tile label="Late" value={s.late} />
          <Tile label="Excused" value={s.excused} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={() => shift(-1)} className="p-1.5 rounded-lg hover:bg-slate-100">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-sm font-semibold text-slate-800">{monthLabel}</span>
        <button onClick={() => shift(1)} className="p-1.5 rounded-lg hover:bg-slate-100">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] font-semibold text-slate-400 py-1">
            {w}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = `${cursor.year}-${pad(cursor.month + 1)}-${pad(day)}`;
          const status = byDate.get(key);
          return (
            <div
              key={key}
              title={status ? `${key}: ${status}` : key}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                status ? STATUS_COLOR[status] : "bg-slate-50 text-slate-400"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        {Object.entries(STATUS_DOT).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px] text-slate-500 capitalize">
            <span className={`w-2.5 h-2.5 rounded-full ${c}`} />
            {k}
          </span>
        ))}
      </div>

      {data && data.records.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-2">
          No attendance recorded for this student yet.
        </p>
      )}
    </div>
  );
};

const Tile: React.FC<{ label: string; value: string | number; accent?: boolean }> = ({
  label,
  value,
  accent,
}) => (
  <div className="rounded-lg bg-slate-50 border border-slate-100 py-2">
    <div className="text-[9px] uppercase tracking-wide text-slate-400">{label}</div>
    <div className={`text-sm font-bold ${accent ? "text-[#0D9488]" : "text-slate-900"}`}>
      {value}
    </div>
  </div>
);

export const AdminAttendanceView: React.FC = () => {
  const { schoolId } = useActiveSchool();
  const { classOptions, sectionOptions } = useClasses();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  const sections = classId ? sectionOptions(classId) : [];
  const overview = useQuery(
    attendanceApi.sectionOverview,
    schoolId && classId && sectionId
      ? {
          schoolId,
          classId: classId as Id<"classes">,
          sectionId: sectionId as Id<"sections">,
        }
      : "skip"
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-[#0D9488]" />
          Attendance Overview
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Review each student's attendance rate. Click a student to see their full
          calendar day‑by‑day.
        </p>
      </div>

      {/* Pickers */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            label="Class"
            value={classId}
            placeholder="Select class"
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId("");
            }}
            options={classOptions}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            label="Section"
            value={sectionId}
            placeholder={classId ? "Select section" : "Choose a class first"}
            disabled={!classId}
            onChange={(e) => setSectionId(e.target.value)}
            options={sections}
          />
        </div>
      </div>

      {!classId || !sectionId ? (
        <EmptyState
          icon={<CalendarCheck className="w-6 h-6" />}
          title="Pick a class & section"
          description="Select a class and section to view its students' attendance."
        />
      ) : overview === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : overview.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="w-6 h-6" />}
          title="No students"
          description="This section has no active students."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
          {overview.map((row) => (
            <button
              key={row.studentId}
              onClick={() => setSelected({ id: row.studentId, name: row.name })}
              className="w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors text-left"
            >
              <Avatar name={row.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{row.name}</p>
                <p className="text-[11px] text-slate-400 font-mono-data">
                  {row.rollNumber} · {row.admissionNumber}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px]">
                <Badge variant="success" size="sm">{row.present} P</Badge>
                <Badge variant="danger" size="sm">{row.absent} A</Badge>
                <Badge variant="warning" size="sm">{row.late} L</Badge>
              </div>
              <div className="w-16 text-right">
                <span
                  className={`text-sm font-bold ${
                    row.rate === null
                      ? "text-slate-300"
                      : row.rate >= 75
                      ? "text-emerald-600"
                      : row.rate >= 50
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}
                >
                  {row.rate === null ? "—" : `${row.rate}%`}
                </span>
              </div>
              <Arrow className="w-4 h-4 text-slate-300" />
            </button>
          ))}
        </div>
      )}

      {/* Calendar popup */}
      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.name} — Attendance` : ""}
        description="Full day‑by‑day attendance calendar."
        size="md"
      >
        {selected && <AttendanceCalendar studentId={selected.id} />}
      </Modal>
    </div>
  );
};
