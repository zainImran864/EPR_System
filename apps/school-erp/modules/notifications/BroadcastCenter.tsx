"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Send,
  Megaphone,
  CheckCheck,
  Trash2,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useNotifications } from "@/app/hooks/useNotifications";
import { useToast } from "@/app/hooks/useToast";

const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "teacher", label: "Teachers" },
  { value: "student", label: "Students" },
  { value: "parent", label: "Parents" },
  { value: "admin", label: "Admins" },
];

const KINDS = [
  { value: "announcement", label: "Announcement" },
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
];

function formatTime(val: any): string {
  if (!val) return "Just now";
  let time: number;
  if (val instanceof Date) time = val.getTime();
  else if (typeof val === "number") time = val < 10000000000 ? val * 1000 : val;
  else if (typeof val === "string") {
    time = /^\d+$/.test(val.trim()) ? Number(val.trim()) * (Number(val.trim()) < 10000000000 ? 1000 : 1) : new Date(val).getTime();
  } else if (typeof val === "object" && val !== null) {
    time = val.$date ? new Date(val.$date).getTime() : NaN;
  } else time = NaN;

  if (isNaN(time) || !isFinite(time)) return "Just now";
  const d = new Date(time);
  if (isNaN(d.getTime())) return "Just now";

  const diffMs = Date.now() - time;
  if (isNaN(diffMs) || diffMs < 60000) return "Just now";

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export const BroadcastCenter: React.FC = () => {
  const { feed, unreadCount, broadcast, markRead, markAllRead, clearAll } =
    useNotifications();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<"inbox" | "broadcast" | "history">("inbox");
  const [filterType, setFilterType] = useState<"all" | "unread" | "leaves">("all");

  const [form, setForm] = useState({
    title: "",
    body: "",
    audienceRole: "all" as "all" | "admin" | "teacher" | "student" | "parent",
    kind: "announcement" as "info" | "success" | "warning" | "announcement",
  });
  const [sending, setSending] = useState(false);

  const isValid = form.title.trim() && form.body.trim();

  const handleSend = async () => {
    if (!isValid) return;
    setSending(true);
    try {
      await broadcast(form);
      success("Notification sent successfully.");
      setForm({ ...form, title: "", body: "" });
    } catch {
      error("Could not send notification.");
    } finally {
      setSending(false);
    }
  };

  const filteredFeed = feed.filter((n) => {
    if (filterType === "unread") return !n.isRead;
    if (filterType === "leaves") {
      const text = `${n.title} ${n.message || n.body}`.toLowerCase();
      return text.includes("leave");
    }
    return true;
  });

  const sent = feed.filter((n) => n.kind === "announcement" || n.createdBy);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200/60 shrink-0">
              <Bell className="w-5 h-5" />
            </span>
            Notifications &amp; Broadcast Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time notifications for teacher leave requests, school announcements, and system alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="warning" size="md">
              {unreadCount} Unread
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={unreadCount === 0}
            leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Mark all read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearAll()}
            disabled={feed.length === 0}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            Clear all
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("inbox")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "inbox"
              ? "bg-teal-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          Inbox &amp; Alerts ({feed.length})
          {unreadCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("broadcast")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "broadcast"
              ? "bg-teal-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          Compose Broadcast
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "history"
              ? "bg-teal-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Broadcast History ({sent.length})
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === "inbox" ? (
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter:</span>
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterType === "all"
                    ? "bg-teal-100 text-teal-800"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                All ({feed.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("unread")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterType === "unread"
                    ? "bg-teal-100 text-teal-800"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("leaves")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterType === "leaves"
                    ? "bg-teal-100 text-teal-800"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                Teacher Leaves
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Live updates every 5 seconds
            </p>
          </div>

          {filteredFeed.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-slate-300" />
              <p>No notifications found in this view.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredFeed.map((n) => {
                const isLeaveNotif = `${n.title} ${n.message || n.body}`
                  .toLowerCase()
                  .includes("leave");
                return (
                  <div
                    key={n._id}
                    className={`py-3.5 px-3 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                      !n.isRead
                        ? "bg-teal-50/50 border border-teal-100/60"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {isLeaveNotif ? (
                          <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                          </span>
                        ) : n.type === "success" ? (
                          <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : n.type === "warning" ? (
                          <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center">
                            <Info className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <Badge variant="warning" size="sm">
                              New / Unread
                            </Badge>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                          {n.message || n.body}
                        </p>
                        {isLeaveNotif && (
                          <div className="pt-1">
                            <Link
                              href="/admin/teacher-attendance"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 hover:underline"
                            >
                              Open Teacher Attendance &amp; Leave Approvals
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => markRead(n._id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs cursor-pointer"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : activeTab === "broadcast" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#0D9488]" />
              Compose Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Title *"
              placeholder="e.g. Parent-Teacher Meeting or School Announcement"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Message *
              </label>
              <textarea
                className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:border-[#0D9488] focus:outline-none min-h-[90px] resize-y text-slate-800"
                placeholder="Write your announcement…"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Audience"
                value={form.audienceRole}
                onChange={(e) =>
                  setForm({ ...form, audienceRole: e.target.value as typeof form.audienceRole })
                }
                options={AUDIENCES}
              />
              <Select
                label="Type"
                value={form.kind}
                onChange={(e) =>
                  setForm({ ...form, kind: e.target.value as typeof form.kind })
                }
                options={KINDS}
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSend}
                isLoading={sending}
                disabled={!isValid}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Notification
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Broadcasts</CardTitle>
          </CardHeader>
          <CardContent>
            {sent.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No broadcasts sent yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {sent.slice(0, 15).map((n) => (
                  <div key={n._id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {n.title}
                        </span>
                        <Badge variant="neutral" size="sm">
                          {n.audienceRole ?? "all"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{n.message || n.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
