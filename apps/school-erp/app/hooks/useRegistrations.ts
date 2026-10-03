"use client";

import { useState, useEffect, useCallback } from "react";
import { superAdminRestApi } from "@/app/api/client";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

/**
 * REST-powered SuperAdmin queue for school registrations and stats.
 */
export function useRegistrations() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reqList, statData] = await Promise.all([
        superAdminRestApi.getPendingRequests().catch(() => []),
        superAdminRestApi.getStats().catch(() => null),
      ]);
      if (Array.isArray(reqList)) {
        setRequests(reqList.map((r) => ({ ...r, _id: r.id || r._id })));
      }
      if (statData) setStats(statData);
    } catch (e) {
      console.warn("Superadmin registrations fetch notice:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const approveRequest = async (requestId: string, reviewNote?: string) => {
    const res = await superAdminRestApi.approveRequest(requestId);
    await fetchQueue();
    return res;
  };

  const rejectRequest = async (requestId: string, reviewNote?: string) => {
    const res = await superAdminRestApi.rejectRequest(requestId, reviewNote);
    await fetchQueue();
    return res;
  };

  const resolveChangeRequest = async (requestId: string, approve: boolean) => {
    if (approve) return approveRequest(requestId);
    return rejectRequest(requestId);
  };

  return {
    requests,
    isLoading,
    stats,
    changeRequests: [] as any[],
    statusFilter,
    setStatusFilter,
    approveRequest,
    rejectRequest,
    resolveChangeRequest,
    refetch: fetchQueue,
  };
}
