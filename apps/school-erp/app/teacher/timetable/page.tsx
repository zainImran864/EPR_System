"use client";

import Link from "next/link";
import { CalendarDays, Printer } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useTeacherTimetable } from "@/app/hooks/useTimetable";
import { TimetableGrid } from "@/modules/timetable/TimetableGrid";

export default function TeacherTimetablePage() {
  const { user } = useAuth();
  const { slots, isLoading } = useTeacherTimetable(user?.linkedTeacherId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#0D9488]" />
            My Timetable
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your weekly lectures across all sections you teach.
          </p>
        </div>

        {slots.length > 0 && (
          <Link
            href={`/print/timetable?teacherId=${user?.linkedTeacherId || ""}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Printer className="w-4 h-4 text-teal-600" />
            Print My Timetable
          </Link>
        )}
      </div>
      <TimetableGrid slots={slots} isLoading={isLoading} showClassSection />
    </div>
  );
}
