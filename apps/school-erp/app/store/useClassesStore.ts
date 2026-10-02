"use client";

import { create } from "zustand";
import { ClassGrade, ClassSection } from "@/app/types/class";

interface ClassesStoreState {
  classes: ClassGrade[];
  selectedClass: ClassGrade | null;
  isLoading: boolean;
  setClasses: (classes: ClassGrade[]) => void;
  addClass: (cls: ClassGrade) => void;
  setSelectedClass: (cls: ClassGrade | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useClassesStore = create<ClassesStoreState>((set) => ({
  classes: [],
  selectedClass: null,
  isLoading: false,

  setClasses: (classes) => set({ classes }),
  addClass: (cls) => set((state) => ({ classes: [...state.classes, cls] })),
  setSelectedClass: (cls) => set({ selectedClass: cls }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
