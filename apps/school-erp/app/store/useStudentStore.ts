"use client";

import { create } from "zustand";
import { Student, StudentFilter } from "@/app/types/student";

interface StudentStoreState {
  students: Student[];
  selectedStudent: Student | null;
  filters: StudentFilter;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => void;
  setSelectedStudent: (student: Student | null) => void;
  setFilters: (filters: Partial<StudentFilter>) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useStudentStore = create<StudentStoreState>((set) => ({
  students: [],
  selectedStudent: null,
  filters: {
    search: "",
    classId: undefined,
    sectionId: undefined,
  },
  currentPage: 1,
  pageSize: 10,
  isLoading: false,

  setStudents: (students) => set({ students }),
  addStudent: (student) =>
    set((state) => ({ students: [student, ...state.students] })),
  setSelectedStudent: (student) => set({ selectedStudent: student }),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 1, // Reset to first page on filter change
    })),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
