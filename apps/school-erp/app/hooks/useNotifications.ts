"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { notificationsRestApi } from "@/app/api/client";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";

export interface BroadcastArgs {
  title: string;
  body: string;
  audienceRole: "all" | "admin" | "teacher" | "student" | "parent";
  kind?: "info" | "success" | "warning" | "announcement";
}

/**
 * REST-powered notification feed for the current user backed by MongoDB and Redis.
 */
export function useNotifications() {
  const { user } = useAuth();
  const { info } = useToast();

  const [feed, setFeed] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationsRestApi.getAll();
      if (Array.isArray(data)) {
        const normalized = data.map((n) => ({
          ...n,
          _id: n.id || n._id,
        }));
        setFeed(normalized);
        setUnreadCount(normalized.filter((n) => !n.isRead).length);
      }
    } catch (e) {
      console.warn("Notifications fetch notice:", e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s poll
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await notificationsRestApi.markAsRead(id);
      setFeed((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.warn("Failed to mark notification as read:", e);
    }
  };

  const markAllRead = async () => {
    setFeed((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const broadcast = async (args: BroadcastArgs) => {
    const res = await notificationsRestApi.broadcast(args);
    await fetchNotifications();
    return res;
  };

  return {
    feed,
    unreadCount,
    isLoading,
    broadcast,
    markRead,
    markAllRead,
    clearAll: markAllRead,
    refetch: fetchNotifications,
  };
}
