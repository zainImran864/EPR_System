"use client";

import { create } from "zustand";
import { School } from "@/app/types/school";

type AppState = {
  isSidebarOpen: boolean;
  activeSession: string;
  /** Real Convex schools _id for the active tenant (set by useActiveSchool). */
  schoolId: string | null;
  activeSchool: School | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveSession: (year: string) => void;
  setSchoolId: (schoolId: string | null) => void;
  setActiveSchool: (school: School | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  activeSession: "2026-2027",
  schoolId: null,
  activeSchool: null,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setActiveSession: (year) => set({ activeSession: year }),
  setSchoolId: (schoolId) => set({ schoolId }),
  setActiveSchool: (school) => set({ activeSchool: school }),
}));
