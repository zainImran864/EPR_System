"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Trash2, Calendar, ExternalLink } from "lucide-react";
import { useNotifications } from "@/app/hooks/useNotifications";
import { useAuth } from "@/app/hooks/useAuth";
import { cn } from "@/app/lib/utils";

const KIND_DOT: Record<string, string> = {
  info: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  announcement: "bg-teal-600",
  urgent: "bg-rose-500",
};

function formatNotificationTime(ts: any): { relative: string; exact: string } {
  if (!ts) return { relative: "just now", exact: new Date().toLocaleTimeString() };
  let time = typeof ts === "string" ? new Date(ts).getTime() : Number(ts);
  if (isNaN(time)) return { relative: "recently", exact: "" };
  if (time < 10000000000) {
    time *= 1000; // handle Unix seconds
  }
  const dateObj = new Date(time);
  const exact = isNaN(dateObj.getTime())
    ? ""
    : dateObj.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

  const diffMs = Date.now() - time;
  if (diffMs < 45000) return { relative: "just now", exact };

  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return { relative: `${mins}m ago`, exact };

  const hours = Math.floor(mins / 60);
  if (hours < 24) return { relative: `${hours}h ago`, exact };

  const days = Math.floor(hours / 24);
  if (days < 7) return { relative: `${days}d ago`, exact };

  return { relative: exact || `${days}d ago`, exact };
}

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { feed, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) {
      markRead(n._id);
    }
    const text = `${n.title} ${n.message || n.body}`.toLowerCase();
    if (text.includes("leave")) {
      setOpen(false);
      if (user?.role === "ADMIN" || user?.role === "SUPERADMIN") {
        router.push("/admin/teacher-attendance");
      } else {
        router.push("/teacher/my-attendance");
      }
    }
  };

  const role = String(user?.role || "").toUpperCase();
  const centerUrl =
    role === "ADMIN" || role === "SUPERADMIN"
      ? "/admin/notifications"
      : role === "TEACHER"
      ? "/teacher/notifications"
      : role === "PARENT"
      ? "/parent/notifications"
      : "/student/notifications";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        title="Notifications"
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-84 max-h-[30rem] rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              {feed.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAll()}
                  className="text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {feed.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                You&apos;re all caught up!
              </div>
            ) : (
              feed.map((n) => {
                const isLeave = `${n.title} ${n.message || n.body}`
                  .toLowerCase()
                  .includes("leave");
                return (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-slate-50/80 transition-colors flex gap-3 cursor-pointer",
                      !n.isRead && "bg-teal-50/60"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 w-2 h-2 rounded-full shrink-0",
                        KIND_DOT[n.type || n.kind] ?? "bg-teal-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {n.title}
                        </span>
                        {(() => {
                          const timeInfo = formatNotificationTime(n.createdAt);
                          return (
                            <span
                              className="text-[10px] text-slate-500 shrink-0 font-mono font-medium"
                              title={timeInfo.exact}
                            >
                              {timeInfo.relative}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message || n.body}
                      </p>
                      {isLeave && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 mt-1">
                          <Calendar className="w-3 h-3" />
                          Click to view in Leave Portal
                        </span>
                      )}
                    </div>
                    {!n.isRead && (
                      <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href={centerUrl}
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
            >
              Open Notification Center
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
