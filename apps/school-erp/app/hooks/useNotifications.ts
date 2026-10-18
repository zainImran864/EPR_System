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
  const { info, success, warning } = useToast();

  const [feed, setFeed] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialLoadRef = useRef(true);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationsRestApi.getAll();
      if (Array.isArray(data)) {
        const normalized = data.map((n) => ({
          ...n,
          _id: n.id || n._id,
        }));

        // Fire real-time toast alert when new unread notification arrives
        if (!isInitialLoadRef.current) {
          for (const item of normalized) {
            if (!item.isRead && !seenIdsRef.current.has(item._id)) {
              const notifType = (item.type || item.kind || "info").toLowerCase();
              const toastFn =
                notifType === "success"
                  ? success
                  : notifType === "warning" || notifType === "urgent"
                  ? warning
                  : info;
              toastFn(item.message || item.body || item.title, {
                title: item.title || "New Notification",
              });
            }
          }
        }

        isInitialLoadRef.current = false;
        seenIdsRef.current = new Set(normalized.map((n) => n._id));
        setFeed(normalized);
        setUnreadCount(normalized.filter((n) => !n.isRead).length);
      }
    } catch {
      // Silently ignore when offline or before backend session is established
    }
  }, [user, info, success, warning]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // 5s live poll for real-time alerts
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

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
    try {
      await notificationsRestApi.markAllAsRead();
    } catch (e) {
      console.warn("Failed to mark all notifications as read:", e);
    }
    setFeed((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const clearAll = async () => {
    try {
      await notificationsRestApi.clearAll();
    } catch (e) {
      console.warn("Failed to clear all notifications:", e);
    }
    setFeed([]);
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
    clearAll,
    refetch: fetchNotifications,
  };
}
