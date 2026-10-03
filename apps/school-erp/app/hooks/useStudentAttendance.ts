"use client";

import { useEffect, useState } from "react";
import { attendanceRestApi } from "@/app/api/client";
import { useActiveSchool } from "./useActiveSchool";

/** One student's attendance record + summary (student/parent view). */
export function useStudentAttendance(studentId?: string | null) {
  const { schoolId } = useActiveSchool();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;
    setIsLoading(true);
    attendanceRestApi
      .getStudentHistory(studentId)
      .then((res) => {
        if (mounted && res) setData(res);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentId, schoolId]);

  return {
    records: data?.records ?? (Array.isArray(data) ? data : []),
    summary: data?.summary ?? {
      total: Array.isArray(data) ? data.length : 0,
      present: Array.isArray(data) ? data.filter((d: any) => d.status === "PRESENT").length : 0,
      percentage: 100,
    },
    isLoading,
  };
}
