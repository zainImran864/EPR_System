"use client";

import { useEffect, useState, useCallback } from "react";
import { marksRestApi, classesRestApi, studentsRestApi } from "@/app/api/client";
import { useMarksStore } from "@/app/store/useMarksStore";
import { useActiveSchool } from "./useActiveSchool";

/**
 * REST-powered mark-entry matrix: exams + subjects pickers and the per-section
 * marks grid backed by PostgreSQL.
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

  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load available exams & subjects for active school
  useEffect(() => {
    let mounted = true;
    Promise.all([
      marksRestApi.getExams().catch(() => []),
      classesRestApi.getAll().catch(() => []),
    ]).then(([examList, classList]) => {
      if (!mounted) return;
      if (Array.isArray(examList)) {
        setExams(examList.map((e) => ({ ...e, _id: e.id || e._id })));
      }
      if (Array.isArray(classList)) {
        const allSubjects: any[] = [];
        classList.forEach((c) => {
          (c.subjects || []).forEach((s: any) => {
            if (!allSubjects.some((x) => x.id === s.id)) {
              allSubjects.push({ ...s, _id: s.id || s._id });
            }
          });
        });
        setSubjects(allSubjects);
      }
    });

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  const ready = Boolean(
    selectedExamId && selectedSectionId && selectedSubjectId
  );

  const fetchMatrix = useCallback(async () => {
    if (!ready) return;
    setIsLoading(true);
    try {
      const [existingMarks, students] = await Promise.all([
        marksRestApi.getMarks(selectedExamId!, selectedSubjectId!, selectedSectionId!),
        studentsRestApi.getAll({ sectionId: selectedSectionId!, status: "active" }),
      ]);

      const marksMap = new Map<string, any>();
      if (Array.isArray(existingMarks)) {
        existingMarks.forEach((m) => {
          marksMap.set(m.studentId, m);
        });
      }

      const merged = (students || []).map((s: any) => {
        const studentId = s.id || s._id;
        const m = marksMap.get(studentId);
        return {
          studentId,
          firstName: s.firstName || (s.fullName || "").split(" ")[0] || "Student",
          lastName: s.lastName || (s.fullName || "").split(" ").slice(1).join(" ") || "",
          rollNumber: s.rollNumber || "",
          totalMarks: m?.totalMarks ?? 100,
          obtainedMarks: m?.obtainedMarks ?? 0,
          grade: m?.grade ?? "A",
          subjectId: selectedSubjectId ?? undefined,
        };
      });

      setMarksRoster(merged);
    } catch (e) {
      console.warn("Marks roster fetch notice:", e);
    } finally {
      setIsLoading(false);
    }
  }, [ready, selectedExamId, selectedSubjectId, selectedSectionId, setMarksRoster]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const saveMarks = async () => {
    if (!ready || !selectedSubjectId || !selectedExamId) return false;
    setIsSaving(true);
    try {
      await marksRestApi.submitBulk({
        examTermId: selectedExamId,
        subjectId: selectedSubjectId,
        entries: marksRoster.map((r) => ({
          studentId: r.studentId,
          obtainedMarks: r.obtainedMarks,
          totalMarks: r.totalMarks,
          grade: r.grade,
        })),
      });
      return true;
    } catch (e) {
      console.error("Failed to save marks:", e);
      return false;
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
    refetch: fetchMatrix,
  };
}
