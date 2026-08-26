"use client";

import React, { useState } from "react";
import {
  Building2,
  Clock,
  CheckCircle2,
  Users,
  Check,
  X,
  Inbox,
} from "lucide-react";
import { RoleGate } from "@/components/auth/RoleGate";
import { RoleHeader } from "@/components/layout/RoleHeader";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { useAuth } from "@/app/hooks/useAuth";
import { useRegistrations } from "@/app/hooks/useRegistrations";
import { useToast } from "@/app/hooks/useToast";

type RequestRow = {
  _id: string;
  schoolName: string;
  schoolSlug: string;
  adminEmail: string;
  contactEmail: string;
  classesOffered: number[];
  totalStudents?: number;
  status: "pending" | "approved" | "rejected";
};

const FILTERS = ["pending", "approved", "rejected", "all"] as const;

function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const {
    requests,
    isLoading,
    stats,
    changeRequests,
    statusFilter,
    setStatusFilter,
    approveRequest,
    rejectRequest,
    resolveChangeRequest,
  } = useRegistrations();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { success, error } = useToast();

  const handleResolveChange = async (id: string, approve: boolean) => {
    setBusyId(id);
    try {
      await resolveChangeRequest(id, approve);
      success(approve ? "School name updated." : "Change request rejected.");
    } catch {
      error("Could not resolve the request.");
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveRequest(id);
      success("School approved — the admin has been notified by email.", {
        title: "Approved",
      });
    } catch {
      error("Could not approve this request.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    const note = window.prompt("Reason for rejection (optional):") ?? undefined;
    setBusyId(id);
    try {
      await rejectRequest(id, note);
      success("Request rejected — the applicant has been notified.", {
        title: "Rejected",
      });
    } catch {
      error("Could not reject this request.");
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<RequestRow>[] = [
    {
      key: "school",
      header: "School",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">{r.schoolName}</span>
          <span className="text-[11px] text-slate-400 font-mono-data">
            @{r.schoolSlug}.com
          </span>
        </div>
      ),
    },
    {
      key: "adminEmail",
      header: "Admin Login",
      render: (r) => (
        <span className="text-xs font-mono-data text-slate-600 break-all">
          {r.adminEmail}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (r) => <span className="text-xs text-slate-500">{r.contactEmail}</span>,
    },
    {
      key: "classes",
      header: "Grades",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.classesOffered.length} grades
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge
          variant={
            r.status === "approved"
              ? "success"
              : r.status === "rejected"
              ? "danger"
              : "warning"
          }
          size="sm"
          dot
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) =>
        r.status === "pending" ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="success"
              size="xs"
              isLoading={busyId === r._id}
              onClick={() => handleApprove(r._id)}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="xs"
              disabled={busyId === r._id}
              onClick={() => handleReject(r._id)}
              leftIcon={<X className="w-3.5 h-3.5" />}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <RoleHeader
        title="Platform Console"
        subtitle="Super Admin"
        platform
        userName={user?.name ?? "Super Admin"}
        roleLabel="Super Admin"
        onLogout={logout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Schools"
            value={stats?.schoolCount ?? "—"}
            subtitle="Approved tenants"
            icon={<Building2 className="w-5 h-5" />}
          />
          <StatCard
            title="Pending"
            value={stats?.pendingCount ?? "—"}
            subtitle="Awaiting review"
            icon={<Clock className="w-5 h-5" />}
          />
          <StatCard
            title="Approved"
            value={stats?.approvedCount ?? "—"}
            subtitle="Total approved"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatCard
            title="Users"
            value={stats?.userCount ?? "—"}
            subtitle="Across platform"
            icon={<Users className="w-5 h-5" />}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                statusFilter === f
                  ? "bg-[#0D9488] text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Requests */}
        <DataGrid<RequestRow>
          columns={columns}
          data={requests as RequestRow[]}
          rowKey={(r) => r._id}
          isLoading={isLoading}
          emptyIcon={<Inbox className="w-6 h-6" />}
          emptyTitle="No registration requests"
          emptyDescription="New school registrations will appear here for approval."
        />

        {/* School name-change requests */}
        {changeRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0D9488]" />
              School Name Change Requests
              <Badge variant="warning" size="sm">
                {changeRequests.length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {changeRequests.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs"
                >
                  <div className="text-sm">
                    <span className="text-slate-500">{c.currentValue}</span>
                    <span className="mx-2 text-slate-300">→</span>
                    <span className="font-semibold text-slate-900">
                      {c.requestedValue}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="success"
                      size="xs"
                      isLoading={busyId === c._id}
                      onClick={() => handleResolveChange(c._id, true)}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="xs"
                      disabled={busyId === c._id}
                      onClick={() => handleResolveChange(c._id, false)}
                      leftIcon={<X className="w-3.5 h-3.5" />}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <RoleGate allow={["superadmin"]}>
      <SuperAdminDashboard />
    </RoleGate>
  );
}
