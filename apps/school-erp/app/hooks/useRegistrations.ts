"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { registrationsApi, superAdminApi } from "@/app/api/registrations";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

/**
 * Super-admin registration queue: filtered requests, platform stats, and
 * approve/reject mutations (Convex reactivity refreshes the list on action).
 */
export function useRegistrations() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const requests = useQuery(
    registrationsApi.list,
    statusFilter === "all" ? {} : { status: statusFilter }
  );
  const stats = useQuery(superAdminApi.stats, {});
  const changeRequests = useQuery(registrationsApi.listChangeRequests, {
    status: "pending",
  });

  const approveMutation = useMutation(registrationsApi.approve);
  const rejectMutation = useMutation(registrationsApi.reject);
  const resolveChangeMutation = useMutation(registrationsApi.resolveChangeRequest);

  return {
    requests: requests ?? [],
    isLoading: requests === undefined,
    stats: stats ?? null,
    changeRequests: changeRequests ?? [],
    statusFilter,
    setStatusFilter,
    approveRequest: (requestId: string, reviewNote?: string) =>
      approveMutation({ requestId, reviewNote }),
    rejectRequest: (requestId: string, reviewNote?: string) =>
      rejectMutation({ requestId, reviewNote }),
    resolveChangeRequest: (requestId: string, approve: boolean) =>
      resolveChangeMutation({ requestId, approve }),
  };
}
