"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { attendanceApi } from "@/app/api/attendance";
import { useAttendanceStore } from "@/app/store/useAttendanceStore";
import { useActiveSchool } from "./useActiveSchool";

/**
 * Loads a section's roster + existing attendance for a date into an editable
 * Zustand copy. Edits stay local until `saveRoster` upserts them; Convex
 * reactivity then reloads the fresh server state.
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

  const ready = Boolean(
    schoolId && selectedClassId && selectedSectionId && selectedDate
  );

  const data = useQuery(
    attendanceApi.sectionRoster,
    ready
      ? {
          schoolId: schoolId!,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          date: selectedDate,
        }
      : "skip"
  );

  const isLoading = ready && data === undefined;

  // Hydrate the editable roster whenever the server roster changes.
  useEffect(() => {
    if (data) setRoster(data.map((r) => ({ ...r })));
  }, [data, setRoster]);

  const saveMutation = useMutation(attendanceApi.save);

  const saveRoster = async () => {
    if (!ready) return false;
    setIsSaving(true);
    try {
      await saveMutation({
        schoolId: schoolId!,
        classId: selectedClassId,
        sectionId: selectedSectionId,
        date: selectedDate,
        records: roster.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks,
        })),
      });
      setHasUnsavedChanges(false);
      return true;
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
  };
}
