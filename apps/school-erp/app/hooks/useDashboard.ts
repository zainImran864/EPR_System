"use client";

import { useEffect, useState, useCallback } from "react";
import { dashboardRestApi, seedApi } from "@/app/api/client";
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
 * Queries the NestJS REST backend with PostgreSQL + Redis live caching.
 */
export function useDashboard(date?: string) {
  const { schoolId } = useActiveSchool();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async (forceFresh: boolean = false) => {
    setIsLoading(true);
    try {
      const data = await dashboardRestApi.getAdminStats();
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.warn("REST dashboard stats fetch notice:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, schoolId, date]);

  return {
    stats: stats || DEFAULT_EMPTY_STATS,
    isLoading: isLoading && !stats,
    refetch: () => fetchStats(true),
  };
}

/** Mutation to seed demo tenant data (wired to the Topbar "Sync Data" action). */
export function useSeed() {
  return async () => {
    return seedApi.seedDemoData();
  };
}
