"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { dashboardApi } from "@/app/api/dashboard";
import { dashboardRestApi } from "@/app/api/client";
import { seedApi } from "@/app/api/seed";
import { useActiveSchool } from "./useActiveSchool";

const DEFAULT_EMPTY_STATS = {
  studentCount: 0,
  teacherCount: 0,
  classCount: 0,
  sectionCount: 0,
  activeStudents: 0,
  todayAttendanceRate: 100,
  attendanceRate: 100,
  totalMarkedToday: 0,
  avgExamScore: null,
  genderBreakdown: { male: 0, female: 0, other: 0 },
  attendanceByStatus: { present: 0, absent: 0, late: 0, excused: 0 },
  gradeDistribution: {},
  recentAdmissions: [],
  financials: {
    totalFees: 0,
    collectedFees: 0,
    pendingFees: 0,
    collectionRate: 100,
  },
};

/**
 * Aggregated dashboard statistics for the active school.
 * Queries the NestJS REST backend with Redis caching and Convex fallback.
 */
export function useDashboard(date?: string) {
  const { schoolId } = useActiveSchool();
  const [restStats, setRestStats] = useState<any>(null);
  const [isRestLoading, setIsRestLoading] = useState(true);

  let convexStats: any = undefined;
  try {
    convexStats = useQuery(
      dashboardApi.stats,
      schoolId ? { schoolId, date } : "skip"
    );
  } catch {
    convexStats = null;
  }

  const fetchRestStats = useCallback(async (forceFresh: boolean = false) => {
    setIsRestLoading(true);
    try {
      const data = await dashboardRestApi.getAdminStats();
      if (data) {
        setRestStats(data);
      }
    } catch (err) {
      console.warn("REST dashboard stats fetch notice:", err);
    } finally {
      setIsRestLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestStats();
  }, [fetchRestStats, schoolId, date]);

  const activeStats = convexStats || restStats || DEFAULT_EMPTY_STATS;
  const isLoading = (convexStats === undefined && isRestLoading && !restStats);

  return {
    stats: activeStats,
    isLoading,
    refetch: () => fetchRestStats(true),
  };
}

/** Mutation to seed demo tenant data (wired to the Topbar "Sync Data" action). */
export function useSeed() {
  return useMutation(seedApi.seedSchool);
}
