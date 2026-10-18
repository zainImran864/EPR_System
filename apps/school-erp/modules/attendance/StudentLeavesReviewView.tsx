"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Filter,
  Search,
  Check,
  X,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/app/hooks/useToast";
import { attendanceRestApi } from "@/app/api/client";

export const StudentLeavesReviewView: React.FC<{ role: "TEACHER" | "ADMIN" }> = ({
  role,
}) => {
  const { success, error } = useToast();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Review modal / action state
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const data = await attendanceRestApi.listStudentLeaves(
        filterStatus === "ALL" ? undefined : filterStatus
      );
      if (Array.isArray(data)) setLeaves(data);
    } catch (e: any) {
      error(e?.message || "Failed to load student leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [filterStatus]);

  const handleOpenReview = (id: string, type: "APPROVED" | "REJECTED") => {
    setReviewingId(id);
    setActionType(type);
    setReviewRemarks(type === "APPROVED" ? "Leave granted. Take care." : "Leave request could not be approved due to upcoming assessments.");
  };

  const handleConfirmReview = async () => {
    if (!reviewingId) return;
    setProcessing(true);
    try {
      await attendanceRestApi.reviewStudentLeave(reviewingId, {
        status: actionType,
        reviewRemarks: reviewRemarks.trim() || undefined,
      });

      success(
        actionType === "APPROVED"
          ? "Leave approved. Attendance automatically updated to LEAVE."
          : "Leave request rejected."
      );
      setReviewingId(null);
      fetchLeaves();
    } catch (err: any) {
      error(err?.message || "Failed to update review status");
    } finally {
      setProcessing(false);
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const sName = (l.student?.fullName || "").toLowerCase();
    const pName = (l.parent?.fullName || "").toLowerCase();
    const cName = (l.student?.class?.name || "").toLowerCase();
    return sName.includes(q) || pName.includes(q) || cName.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-teal-600" />
            Student Leave Applications
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review parent leave requests. Approving a leave automatically marks the student's attendance as <strong>LEAVE</strong>.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === s
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, parent or class…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Review Dialog/Modal */}
      {reviewingId && (
        <div className="p-4 rounded-2xl bg-teal-50/90 border border-teal-200 shadow-xs space-y-3 animate-in fade-in duration-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
              {actionType === "APPROVED" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600" />
              )}
              Confirm Leave {actionType === "APPROVED" ? "Approval" : "Rejection"}
            </h4>
            <button
              type="button"
              onClick={() => setReviewingId(null)}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Feedback Remarks to Parent (Optional)
            </label>
            <input
              type="text"
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              placeholder="e.g. Leave granted. Student must catch up on homework upon return."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReviewingId(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "APPROVED" ? "primary" : "secondary"}
              size="sm"
              onClick={handleConfirmReview}
              isLoading={processing}
              className="text-xs font-bold"
            >
              Confirm {actionType === "APPROVED" ? "Approval & Mark LEAVE" : "Rejection"}
            </Button>
          </div>
        </div>
      )}

      {/* Leaves Card List */}
      <Card className="p-4 sm:p-5">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading student leave applications…
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              No leave applications matching the selected criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLeaves.map((l) => {
              const sDate = new Date(l.startDate).toLocaleDateString();
              const eDate = new Date(l.endDate).toLocaleDateString();
              const isPending = l.status === "PENDING";
              const isApproved = l.status === "APPROVED";
              const isRejected = l.status === "REJECTED";

              return (
                <div
                  key={l.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {l.student?.fullName || "Student"}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {l.student?.class?.name || "Class"} {l.student?.section?.name ? `· ${l.student?.section?.name}` : ""}
                      </span>
                      {l.student?.rollNumber && (
                        <span className="text-[11px] font-mono text-slate-400">
                          Roll #{l.student.rollNumber}
                        </span>
                      )}
                      <Badge
                        variant={
                          isApproved ? "success" : isRejected ? "danger" : "warning"
                        }
                        size="sm"
                      >
                        {l.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-700">
                      <strong>Dates:</strong> {sDate} → {eDate}
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <strong className="text-slate-800">Reason:</strong> {l.reason}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                      <span>Parent: {l.parent?.fullName || "Parent"} ({l.parent?.phone || "—"})</span>
                      <span>Filed: {new Date(l.createdAt).toLocaleDateString()}</span>
                      {l.reviewedBy && (
                        <span className="text-teal-700 font-medium">
                          Reviewed by {l.reviewedBy}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {isPending ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenReview(l.id, "APPROVED")}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                      >
                        Approve &amp; Mark LEAVE
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReview(l.id, "REJECTED")}
                        leftIcon={<X className="w-3.5 h-3.5 text-rose-600" />}
                        className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {isApproved ? "✓ Synced with Attendance" : "✕ Rejected"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
