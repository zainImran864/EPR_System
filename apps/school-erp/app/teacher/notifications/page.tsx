"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Trash2,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useNotifications } from "@/app/hooks/useNotifications";

function formatTime(val: any): string {
  if (!val) return "just now";
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "recently" : d.toLocaleString();
  } catch {
    return "recently";
  }
}

export default function TeacherNotificationsPage() {
  const { feed, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [filterType, setFilterType] = useState<"all" | "unread" | "leaves">("all");

  const filteredFeed = feed.filter((n) => {
    if (filterType === "unread") return !n.isRead;
    if (filterType === "leaves") {
      const text = `${n.title} ${n.message || n.body}`.toLowerCase();
      return text.includes("leave");
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200/60 shrink-0">
              <Bell className="w-5 h-5" />
            </span>
            Teacher Notifications &amp; Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time updates on your leave requests, attendance verifications, and school notices
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

      {/* Inbox Card */}
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
              Leave Updates
            </button>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Synced live with school administration
          </p>
        </div>

        {filteredFeed.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-slate-300" />
            <p>You&apos;re all caught up! No notifications in this view.</p>
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
                        <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center">
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
                            href="/teacher/my-attendance"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 hover:underline"
                          >
                            Open My Attendance &amp; Leave Portal
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
    </div>
  );
}
