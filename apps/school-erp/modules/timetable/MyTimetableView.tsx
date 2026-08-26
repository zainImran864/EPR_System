"use client";

import React from "react";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useSectionTimetable } from "@/app/hooks/useTimetable";
import { TimetableGrid } from "./TimetableGrid";
import { EmptyState } from "@/components/ui/EmptyState";

export interface MyTimetableViewProps {
  title: string;
  subtitle: string;
}

/** Timetable for the current student/parent's own section (from studentContext). */
export const MyTimetableView: React.FC<MyTimetableViewProps> = ({ title, subtitle }) => {
  const { user } = useAuth();
  const ctx = user?.studentContext;
  const { slots, isLoading } = useSectionTimetable(ctx?.classId, ctx?.sectionId);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#0D9488]" />
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
        {ctx && (
          <p className="text-xs text-teal-600 mt-1 font-medium">
            {ctx.className} · {ctx.sectionName}
          </p>
        )}
      </div>

      {!ctx ? (
        <EmptyState
          icon={<CalendarDays className="w-6 h-6" />}
          title="No class linked yet"
          description="Your account isn't linked to a class section yet. Please contact your school administrator."
        />
      ) : (
        <TimetableGrid slots={slots} isLoading={isLoading} />
      )}
    </div>
  );
};
