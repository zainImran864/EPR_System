"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarPlus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/useToast";
import { attendanceRestApi, parentRestApi } from "@/app/api/client";

export default function ParentLeavesPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const activeChild = user?.studentContext;

  const [children, setChildren] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    activeChild?.studentId || ""
  );

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [leaves, setLeaves] = useState<any[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);

  // Fetch parent's children
  useEffect(() => {
    parentRestApi
      .getChildren()
      .then((data) => {
        if (Array.isArray(data)) {
          setChildren(data);
          if (!selectedStudentId && data.length > 0) {
            setSelectedStudentId(data[0].studentId);
          }
        }
      })
      .catch(() => {});
  }, [selectedStudentId]);

  const loadLeaves = () => {
    setLoadingLeaves(true);
    attendanceRestApi
      .listStudentLeaves()
      .then((res) => {
        if (Array.isArray(res)) setLeaves(res);
      })
      .catch(() => {})
      .finally(() => setLoadingLeaves(false));
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      error("Please select a student");
      return;
    }
    if (!reason.trim()) {
      error("Please provide a reason for the leave");
      return;
    }

    setSubmitting(true);
    try {
      await attendanceRestApi.applyStudentLeave({
        studentId: selectedStudentId,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      success("Leave application submitted. The class teacher & school admin will review it.");
      setReason("");
      loadLeaves();
    } catch (err: any) {
      error(err?.message || "Failed to submit leave application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-teal-600" />
          Apply for Student Leave
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Submit official absence requests directly to class teachers and school administration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Application Form */}
        <Card className="lg:col-span-5 p-5 space-y-4 border-teal-100 shadow-2xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-teal-600" />
              New Leave Application
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Approved leaves automatically update attendance status to LEAVE
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Child *
              </label>
              {children.length > 1 ? (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {children.map((c) => (
                    <option key={c.studentId} value={c.studentId}>
                      {c.fullName} ({c.className} {c.sectionName ? `· ${c.sectionName}` : ""})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>
                    {activeChild?.fullName || children[0]?.fullName || "Enrolled Student"}
                  </span>
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date *"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date *"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reason for Leave *
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. High fever & medical rest recommended by physician / Family wedding"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={submitting}
              leftIcon={<Send className="w-4 h-4" />}
              className="text-xs font-bold"
            >
              Submit Leave Request
            </Button>
          </form>
        </Card>

        {/* Right 7 Cols: History & Review Status */}
        <Card className="lg:col-span-7 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Application History &amp; Status
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {leaves.length} Submissions
            </span>
          </div>

          {loadingLeaves ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading leave records…
            </div>
          ) : leaves.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                No leave requests filed yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaves.map((l) => {
                const sDate = new Date(l.startDate).toLocaleDateString();
                const eDate = new Date(l.endDate).toLocaleDateString();
                const isApproved = l.status === "APPROVED";
                const isRejected = l.status === "REJECTED";

                return (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white shadow-2xs space-y-2 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {l.student?.fullName || "Student"}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({l.student?.class?.name || "Class"} {l.student?.section?.name ? `· ${l.student?.section?.name}` : ""})
                        </span>
                      </div>

                      <Badge
                        variant={
                          isApproved ? "success" : isRejected ? "danger" : "warning"
                        }
                        size="sm"
                      >
                        {l.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>Reason:</strong> {l.reason}
                    </p>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>
                        Dates: <strong className="text-slate-800">{sDate}</strong> → <strong className="text-slate-800">{eDate}</strong>
                      </span>
                      <span>
                        Submitted: {new Date(l.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {l.reviewRemarks && (
                      <div className="p-2 rounded-lg bg-teal-50/70 border border-teal-100 text-[11px] text-teal-900">
                        <strong>Teacher / Admin Remarks:</strong> {l.reviewRemarks}{" "}
                        {l.reviewedBy ? `— Reviewed by ${l.reviewedBy}` : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
