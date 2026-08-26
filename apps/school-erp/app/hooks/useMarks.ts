"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { marksApi } from "@/app/api/marks";
import { useMarksStore } from "@/app/store/useMarksStore";
import { useActiveSchool } from "./useActiveSchool";

/**
 * Drives the mark-entry grid: exams + subjects pickers and the per-section
 * marks matrix. Scores are edited in the Zustand store (with auto-grading)
 * and upserted on save.
 */
export function useMarks() {
  const { schoolId } = useActiveSchool();
  const {
    selectedExamId,
    selectedSubjectId,
    selectedClassId,
    selectedSectionId,
    marksRoster,
    isSaving,
    setSelectedExamId,
    setSelectedSubjectId,
    setSelectedClass,
    setSelectedSection,
    setMarksRoster,
    updateScore,
    setIsSaving,
  } = useMarksStore();

  const exams =
    useQuery(marksApi.listExams, schoolId ? { schoolId } : "skip") ?? [];
  const subjects =
    useQuery(marksApi.listSubjects, schoolId ? { schoolId } : "skip") ?? [];

  const ready = Boolean(
    schoolId && selectedExamId && selectedClassId && selectedSectionId
  );

  const matrix = useQuery(
    marksApi.matrix,
    ready
      ? {
          schoolId: schoolId!,
          examId: selectedExamId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          subjectId: selectedSubjectId || undefined,
        }
      : "skip"
  );

  const isLoading = ready && matrix === undefined;

  useEffect(() => {
    if (matrix) {
      setMarksRoster(
        matrix.map((m) => ({
          studentId: m.studentId,
          firstName: m.firstName,
          lastName: m.lastName,
          rollNumber: m.rollNumber,
          totalMarks: m.totalMarks,
          obtainedMarks: m.obtainedMarks ?? 0,
          grade: m.grade,
          subjectId: m.subjectId ?? undefined,
        }))
      );
    }
  }, [matrix, setMarksRoster]);

  const saveMutation = useMutation(marksApi.save);

  const saveMarks = async () => {
    if (!ready || !selectedSubjectId) return false;
    setIsSaving(true);
    try {
      await saveMutation({
        schoolId: schoolId!,
        examId: selectedExamId,
        classId: selectedClassId,
        sectionId: selectedSectionId,
        subjectId: selectedSubjectId,
        entries: marksRoster.map((r) => ({
          studentId: r.studentId,
          obtainedMarks: r.obtainedMarks,
          totalMarks: r.totalMarks,
          grade: r.grade,
        })),
      });
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    exams,
    subjects,
    marksRoster,
    isLoading,
    isSaving,
    selectedExamId,
    selectedSubjectId,
    selectedClassId,
    selectedSectionId,
    setSelectedExamId,
    setSelectedSubjectId,
    setSelectedClass,
    setSelectedSection,
    updateScore,
    saveMarks,
  };
}
