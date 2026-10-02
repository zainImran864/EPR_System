"use client";

import { useEffect, useState, useCallback } from "react";
import { attendanceRestApi, studentsRestApi } from "@/app/api/client";
import { useAttendanceStore } from "@/app/store/useAttendanceStore";
import { useActiveSchool } from "./useActiveSchool";

/**
 * REST-powered attendance roster manager. Loads existing attendance or
 * generates active students roster for the chosen class/section & date.
 */
export function useAttendance() {
  const { schoolId } = useActiveSchool();
  const {
    selectedDate,
    selectedClassId,
    selectedSectionId,
    roster,
    isSaving,
    hasUnsavedChanges,
    setSelectedDate,
    setSelectedClass,
    setSelectedSection,
    setRoster,
    updateStatus,
    markAll,
    updateRemarks,
    setIsSaving,
    setHasUnsavedChanges,
  } = useAttendanceStore();

  const [isLoading, setIsLoading] = useState(false);

  const ready = Boolean(
    schoolId && selectedClassId && selectedSectionId && selectedDate
  );

  const fetchRoster = useCallback(async () => {
    if (!ready || !selectedSectionId) return;
    setIsLoading(true);
    try {
      // 1. Fetch attendance recorded for this section & date
      const attendance = await attendanceRestApi.getByDate(selectedDate, selectedSectionId);
      // 2. Fetch active students in this section
      const students = await studentsRestApi.getAll({
        sectionId: selectedSectionId,
        status: "active",
      });

      const recordsMap = new Map<string, any>();
      if (Array.isArray(attendance)) {
        attendance.forEach((a) => {
          recordsMap.set(a.studentId, a);
        });
      }

      const mergedRoster = (students || []).map((s: any) => {
        const studentId = s.id || s._id;
        const existing = recordsMap.get(studentId);
        return {
          studentId,
          firstName: s.firstName || (s.fullName || "").split(" ")[0] || "Student",
          lastName: s.lastName || (s.fullName || "").split(" ").slice(1).join(" ") || "",
          rollNumber: s.rollNumber || "",
          status: (existing?.status?.toLowerCase() || "present") as "present" | "absent" | "late" | "excused",
          remarks: existing?.remarks || "",
        };
      });

      setRoster(mergedRoster);
    } catch (e) {
      console.warn("Attendance roster fetch notice:", e);
    } finally {
      setIsLoading(false);
    }
  }, [ready, selectedSectionId, selectedDate, setRoster]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const saveRoster = async () => {
    if (!ready || !selectedSectionId) return false;
    setIsSaving(true);
    try {
      await attendanceRestApi.recordBulk({
        sectionId: selectedSectionId,
        date: selectedDate,
        records: roster.map((r) => ({
          studentId: r.studentId,
          status: r.status.toUpperCase(),
          remarks: r.remarks,
        })),
      });
      setHasUnsavedChanges(false);
      return true;
    } catch (err) {
      console.error("Failed to save attendance:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const summary = {
    total: roster.length,
    present: roster.filter((r) => r.status === "present").length,
    absent: roster.filter((r) => r.status === "absent").length,
    late: roster.filter((r) => r.status === "late").length,
    excused: roster.filter((r) => r.status === "excused").length,
  };

  return {
    schoolId,
    selectedDate,
    selectedClassId,
    selectedSectionId,
    roster,
    summary,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    setSelectedDate,
    setSelectedClass,
    setSelectedSection,
    updateStatus,
    markAll,
    updateRemarks,
    saveRoster,
    refetch: fetchRoster,
  };
}
