"use client";

import React, { useState } from "react";
import { Bell, Send, Megaphone, CheckCheck, Trash2 } from "lucide-react";
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

export const BroadcastCenter: React.FC = () => {
  const { feed, unreadCount, broadcast, markAllRead, clearAll } = useNotifications();
  const { success, error } = useToast();
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
      success("Notification sent.");
      setForm({ ...form, title: "", body: "" });
    } catch {
      error("Could not send notification.");
    } finally {
      setSending(false);
    }
  };

  const sent = feed.filter((n) => n.kind === "announcement" || n.createdBy);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0D9488]" />
            Notification Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Broadcast announcements to a role. Recipients get a live toast + bell alert.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={unreadCount === 0}
            leftIcon={<CheckCheck className="w-4 h-4" />}
            className="text-xs"
          >
            Mark all read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearAll()}
            disabled={feed.length === 0}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            Delete all
          </Button>
        </div>
      </div>

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
            placeholder="e.g. Parent-Teacher Meeting"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              Message *
            </label>
            <textarea
              className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:border-[#0D9488] focus:outline-none min-h-[90px] resize-y"
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
                    <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
