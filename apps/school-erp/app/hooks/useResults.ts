"use client";

import { useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { resultsApi } from "@/app/api/results";
import { useActiveSchool } from "./useActiveSchool";

/** A student's aggregated results across all exams (student/parent view). */
export function useStudentResults(studentId?: string | null) {
  const { schoolId } = useActiveSchool();
  const results = useQuery(
    resultsApi.getStudentResults,
    schoolId && studentId
      ? { schoolId, studentId: studentId as Id<"students"> }
      : "skip"
  );
  return { results: results ?? [], isLoading: results === undefined && Boolean(studentId) };
}

/** Full printable report-card payload for one student + exam. */
export function useReportCard(studentId?: string | null, examId?: string | null) {
  const { schoolId } = useActiveSchool();
  const data = useQuery(
    resultsApi.getReportCard,
    schoolId && studentId && examId
      ? {
          schoolId,
          studentId: studentId as Id<"students">,
          examId: examId as Id<"exams">,
        }
      : "skip"
  );
  return { report: data ?? null, isLoading: data === undefined };
}
