"use client";

import React from "react";
import { DAYS } from "@/app/api/timetable";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarDays } from "lucide-react";

export interface TimetableSlot {
  _id: string;
  dayOfWeek: number;
  period: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName?: string | null;
  className?: string;
  sectionName?: string;
  room?: string | null;
}

export interface TimetableGridProps {
  slots: TimetableSlot[];
  isLoading?: boolean;
  /** Show class/section per cell (used for the teacher's cross-section view). */
  showClassSection?: boolean;
}

/** Read-only weekly timetable grid (day rows × period columns). */
export const TimetableGrid: React.FC<TimetableGridProps> = ({
  slots,
  isLoading,
  showClassSection,
}) => {
  if (isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }
  if (!slots.length) {
    return (
      <EmptyState
        icon={<CalendarDays className="w-6 h-6" />}
        title="No timetable yet"
        description="The school administrator hasn't published this timetable."
      />
    );
  }

  const periods = Array.from(new Set(slots.map((s) => s.period))).sort((a, b) => a - b);
  const cell = (day: number, period: number) =>
    slots.find((s) => s.dayOfWeek === day && s.period === period);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50">
            <th className="p-2.5 text-left font-semibold text-slate-500 border-b border-slate-200 sticky left-0 bg-slate-50 z-10">
              Day
            </th>
            {periods.map((p) => {
              const anchor = slots.find((s) => s.period === p);
              return (
                <th
                  key={p}
                  className="p-2.5 text-center font-semibold text-slate-500 border-b border-l border-slate-200 min-w-[120px]"
                >
                  <div>Period {p}</div>
                  {anchor && (
                    <div className="text-[10px] font-normal text-slate-400 font-mono-data mt-0.5">
                      {anchor.startTime}–{anchor.endTime}
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <tr key={day.value} className="hover:bg-slate-50/50">
              <td className="p-2.5 font-semibold text-slate-700 border-b border-slate-100 sticky left-0 bg-white z-10">
                {day.short}
              </td>
              {periods.map((p) => {
                const c = cell(day.value, p);
                return (
                  <td
                    key={p}
                    className="p-1.5 border-b border-l border-slate-100 align-top"
                  >
                    {c ? (
                      <div className="rounded-lg bg-[#F0FDFA] border border-teal-100 px-2 py-1.5">
                        <div className="font-semibold text-teal-800 leading-tight">
                          {c.subjectName}
                        </div>
                        {showClassSection && c.className && (
                          <div className="text-[10px] text-teal-600 mt-0.5">
                            {c.className} · {c.sectionName}
                          </div>
                        )}
                        {c.teacherName && !showClassSection && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {c.teacherName}
                          </div>
                        )}
                        {c.room && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Room {c.room}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-8" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
