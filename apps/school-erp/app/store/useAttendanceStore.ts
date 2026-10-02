"use client";

import { create } from "zustand";
import { AttendanceRecord, AttendanceStatus } from "@/app/types/attendance";

interface AttendanceStoreState {
  selectedDate: string;
  selectedClassId: string;
  selectedSectionId: string;
  roster: AttendanceRecord[];
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  setSelectedDate: (date: string) => void;
  setSelectedClass: (classId: string, sectionId?: string) => void;
  setSelectedSection: (sectionId: string) => void;
  setRoster: (roster: AttendanceRecord[]) => void;
  updateStatus: (index: number, status: AttendanceStatus) => void;
  markAll: (status: AttendanceStatus) => void;
  updateRemarks: (index: number, remarks: string) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

export const useAttendanceStore = create<AttendanceStoreState>((set) => ({
  selectedDate: new Date().toISOString().split("T")[0],
  selectedClassId: "",
  selectedSectionId: "",
  roster: [],
  isLoading: false,
  isSaving: false,
  hasUnsavedChanges: false,

  setSelectedDate: (date) => set({ selectedDate: date, hasUnsavedChanges: false }),
  setSelectedClass: (classId, sectionId) =>
    set({
      selectedClassId: classId,
      selectedSectionId: sectionId || "",
      hasUnsavedChanges: false,
    }),
  setSelectedSection: (sectionId) =>
    set({ selectedSectionId: sectionId, hasUnsavedChanges: false }),
  setRoster: (roster) => set({ roster, hasUnsavedChanges: false }),
  updateStatus: (index, status) =>
    set((state) => {
      const updated = [...state.roster];
      if (updated[index]) {
        updated[index] = { ...updated[index], status };
      }
      return { roster: updated, hasUnsavedChanges: true };
    }),
  markAll: (status) =>
    set((state) => ({
      roster: state.roster.map((r) => ({ ...r, status })),
      hasUnsavedChanges: true,
    })),
  updateRemarks: (index, remarks) =>
    set((state) => {
      const updated = [...state.roster];
      if (updated[index]) {
        updated[index] = { ...updated[index], remarks };
      }
      return { roster: updated, hasUnsavedChanges: true };
    }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
}));
