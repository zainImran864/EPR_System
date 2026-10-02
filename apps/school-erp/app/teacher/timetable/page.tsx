"use client";

import { CalendarDays } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useTeacherTimetable } from "@/app/hooks/useTimetable";
import { TimetableGrid } from "@/modules/timetable/TimetableGrid";

export default function TeacherTimetablePage() {
  const { user } = useAuth();
  const { slots, isLoading } = useTeacherTimetable(user?.linkedTeacherId);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#0D9488]" />
          My Timetable
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Your weekly lectures across all sections you teach.
        </p>
      </div>
      <TimetableGrid slots={slots} isLoading={isLoading} showClassSection />
    </div>
  );
}
