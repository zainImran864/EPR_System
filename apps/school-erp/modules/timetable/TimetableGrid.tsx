"use client";

import React from "react";
import { DAYS } from "@/app/api/timetable";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarDays, MapPin, Users, BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

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
  isSharedRoom?: boolean;
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
        title="No timetable scheduled yet"
        description="The school administrator has not published this timetable matrix yet."
      />
    );
  }

  const periods = Array.from(new Set(slots.map((s) => s.period))).sort((a, b) => a - b);
  const getCellSlots = (day: number, period: number) =>
    slots.filter((s) => s.dayOfWeek === day && s.period === period);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50">
            <th className="p-3 text-left font-semibold text-slate-600 border-b border-slate-200 sticky left-0 bg-slate-50 z-10 min-w-[90px]">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
                Day
              </div>
            </th>
            {periods.map((p) => {
              const anchor = slots.find((s) => s.period === p);
              return (
                <th
                  key={p}
                  className="p-3 text-center font-semibold text-slate-600 border-b border-l border-slate-200 min-w-[140px]"
                >
                  <div className="font-bold text-slate-800">Period {p}</div>
                  {anchor && (
                    <div className="text-[11px] font-normal text-slate-500 font-mono-data mt-0.5 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
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
              <td className="p-3 font-semibold text-slate-800 border-b border-slate-100 sticky left-0 bg-white z-10">
                <div className="text-xs font-bold text-slate-800">{day.label}</div>
                <div className="text-[10px] font-medium text-slate-400 uppercase">{day.short}</div>
              </td>
              {periods.map((p) => {
                const cellSlots = getCellSlots(day.value, p);
                return (
                  <td
                    key={p}
                    className="p-1.5 border-b border-l border-slate-100 align-top"
                  >
                    {cellSlots.length > 0 ? (
                      <div className="space-y-1.5">
                        {cellSlots.map((c, idx) => (
                          <div
                            key={c._id || idx}
                            className="rounded-lg bg-[#F0FDFA] border border-teal-200/80 p-2 shadow-2xs hover:border-teal-400 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-teal-900 leading-tight text-xs flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-teal-600 shrink-0" />
                                {c.subjectName}
                              </span>
                              {cellSlots.length > 1 && (
                                <Badge variant="warning" size="sm" className="text-[9px] px-1 py-0">
                                  Joint
                                </Badge>
                              )}
                            </div>

                            {showClassSection && (c.className || c.sectionName) && (
                              <div className="text-[11px] font-medium text-teal-700 mt-1 flex items-center gap-1">
                                <Users className="w-3 h-3 text-teal-600 shrink-0" />
                                <span>{c.className} {c.sectionName ? `(${c.sectionName})` : ""}</span>
                              </div>
                            )}

                            {c.teacherName && !showClassSection && (
                              <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{c.teacherName}</span>
                              </div>
                            )}

                            {c.room && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-white/80 rounded px-1.5 py-0.5 border border-slate-200/60 w-fit">
                                <MapPin className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                                <span>Room {c.room}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-12 flex items-center justify-center text-slate-300 text-[11px]">
                        —
                      </div>
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
