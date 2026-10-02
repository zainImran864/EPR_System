"use client";

import { useEffect, useState } from "react";
import { marksRestApi } from "@/app/api/client";
import { useActiveSchool } from "./useActiveSchool";

/** A student's aggregated results across all exams (student/parent view). */
export function useStudentResults(studentId?: string | null) {
  const { schoolId } = useActiveSchool();
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;
    setIsLoading(true);
    marksRestApi
      .getStudentReportCard(studentId)
      .then((res) => {
        if (mounted && res) {
          setResults(Array.isArray(res) ? res : [res]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentId, schoolId]);

  return { results, isLoading };
}

/** Full printable report-card payload for one student + exam. */
export function useReportCard(studentId?: string | null, examId?: string | null) {
  const { schoolId } = useActiveSchool();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;
    setIsLoading(true);
    marksRestApi
      .getStudentReportCard(studentId, examId || undefined)
      .then((res) => {
        if (mounted && res) setReport(res);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentId, examId, schoolId]);

  return { report, isLoading };
}
