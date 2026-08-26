"use client";

import { create } from "zustand";
import { StudentMarkRow } from "@/app/types/marks";
import { getGradeFromScore } from "@/app/lib/formatters";

interface MarksStoreState {
  selectedExamId: string;
  selectedSubjectId: string;
  selectedClassId: string;
  selectedSectionId: string;
  marksRoster: StudentMarkRow[];
  isLoading: boolean;
  isSaving: boolean;
  setSelectedExamId: (id: string) => void;
  setSelectedSubjectId: (id: string) => void;
  setSelectedClass: (classId: string, sectionId?: string) => void;
  setSelectedSection: (sectionId: string) => void;
  setMarksRoster: (roster: StudentMarkRow[]) => void;
  updateScore: (index: number, obtained: number) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSaving: (saving: boolean) => void;
}

export const useMarksStore = create<MarksStoreState>((set) => ({
  selectedExamId: "",
  selectedSubjectId: "",
  selectedClassId: "",
  selectedSectionId: "",
  marksRoster: [],
  isLoading: false,
  isSaving: false,

  setSelectedExamId: (id) => set({ selectedExamId: id }),
  setSelectedSubjectId: (id) => set({ selectedSubjectId: id }),
  setSelectedClass: (classId, sectionId) =>
    set({ selectedClassId: classId, selectedSectionId: sectionId ?? "" }),
  setSelectedSection: (sectionId) => set({ selectedSectionId: sectionId }),
  setMarksRoster: (roster) => set({ marksRoster: roster }),
  updateScore: (index, obtained) =>
    set((state) => {
      const updated = [...state.marksRoster];
      if (updated[index]) {
        const clamped = Math.max(0, Math.min(100, obtained || 0));
        updated[index] = {
          ...updated[index],
          obtainedMarks: clamped,
          grade: getGradeFromScore(clamped, updated[index].totalMarks),
        };
      }
      return { marksRoster: updated };
    }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsSaving: (saving) => set({ isSaving: saving }),
}));
