"use client";

import { useQuery, useMutation } from "convex/react";
import { dashboardApi } from "@/app/api/dashboard";
import { seedApi } from "@/app/api/seed";
import { useActiveSchool } from "./useActiveSchool";

/**
 * Aggregated dashboard statistics for the active school. Pass a `date`
 * ("YYYY-MM-DD") to include that day's attendance rate/breakdown.
 */
export function useDashboard(date?: string) {
  const { schoolId } = useActiveSchool();

  const stats = useQuery(
    dashboardApi.stats,
    schoolId ? { schoolId, date } : "skip"
  );

  return {
    stats: stats ?? null,
    isLoading: schoolId === null || stats === undefined,
  };
}

/** Mutation to seed demo tenant data (wired to the Topbar "Sync Data" action). */
export function useSeed() {
  return useMutation(seedApi.seedSchool);
}
