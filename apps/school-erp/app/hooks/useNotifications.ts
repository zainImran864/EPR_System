"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { notificationsApi } from "@/app/api/notifications";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";

export interface BroadcastArgs {
  title: string;
  body: string;
  audienceRole: "all" | "admin" | "teacher" | "student" | "parent";
  kind?: "info" | "success" | "warning" | "announcement";
}

/**
 * Reactive notification feed for the current user. Surfaces a live toast when a
 * new notification arrives (respecting the user's notification preference).
 */
export function useNotifications() {
  const { user } = useAuth();
  const userId = user?._id ?? null;
  const { info } = useToast();

  const feed = useQuery(
    notificationsApi.listForUser,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );
  const unread = useQuery(
    notificationsApi.unreadCount,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );

  const broadcastMutation = useMutation(notificationsApi.broadcast);
  const markReadMutation = useMutation(notificationsApi.markRead);
  const markAllReadMutation = useMutation(notificationsApi.markAllRead);
  const clearAllMutation = useMutation(notificationsApi.clearAll);

  // Live toast on newly-arrived notification (skip first load).
  const seenTopId = useRef<string | null>(null);
  const initialized = useRef(false);
  useEffect(() => {
    if (!feed || feed.length === 0) return;
    const top = feed[0];
    if (!initialized.current) {
      initialized.current = true;
      seenTopId.current = top._id;
      return;
    }
    if (top._id !== seenTopId.current) {
      seenTopId.current = top._id;
      if (!top.isRead && user?.notificationsEnabled !== false) {
        info(`${top.title}: ${top.body}`);
      }
    }
  }, [feed, info, user?.notificationsEnabled]);

  const broadcast = (args: BroadcastArgs) =>
    user?.schoolId
      ? broadcastMutation({
          schoolId: user.schoolId as Id<"schools">,
          createdBy: userId as Id<"users">,
          ...args,
        })
      : undefined;

  const markRead = (notificationId: string) =>
    userId
      ? markReadMutation({
          userId: userId as Id<"users">,
          notificationId: notificationId as Id<"notifications">,
        })
      : undefined;

  const markAllRead = () =>
    userId ? markAllReadMutation({ userId: userId as Id<"users"> }) : undefined;

  const clearAll = () =>
    userId ? clearAllMutation({ userId: userId as Id<"users"> }) : undefined;

  return {
    feed: feed ?? [],
    unreadCount: unread ?? 0,
    isLoading: feed === undefined,
    broadcast,
    markRead,
    markAllRead,
    clearAll,
  };
}
