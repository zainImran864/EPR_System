"use client";

import { useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { attendanceApi } from "@/app/api/attendance";
import { useActiveSchool } from "./useActiveSchool";

/** One student's attendance record + summary (student/parent view). */
export function useStudentAttendance(studentId?: string | null) {
  const { schoolId } = useActiveSchool();
  const data = useQuery(
    attendanceApi.studentAttendance,
    schoolId && studentId
      ? { schoolId, studentId: studentId as Id<"students"> }
      : "skip"
  );
  return {
    records: data?.records ?? [],
    summary: data?.summary ?? null,
    isLoading: data === undefined && Boolean(studentId),
  };
}
