"use client";

import { useEffect, useState, useCallback } from "react";
import { attendanceRestApi, studentsRestApi } from "@/app/api/client";
import { useAttendanceStore } from "@/app/store/useAttendanceStore";
import { useActiveSchool } from "./useActiveSchool";

const OFFLINE_QUEUE_KEY = "academix_offline_attendance_queue";

interface QueuedAttendance {
  id: string;
  sectionId: string;
  date: string;
  records: { studentId: string; status: string; remarks?: string }[];
  queuedAt: string;
}

/**
 * REST-powered attendance roster manager with offline resilience.
 * When connectivity drops, attendance sheets are stored locally in IndexedDB/localStorage
 * and auto-synced the instant internet connectivity is restored.
 */
export function useAttendance() {
  const { schoolId } = useActiveSchool();
  const {
    selectedDate,
    selectedClassId,
    selectedSectionId,
    roster,
    isSaving,
    hasUnsavedChanges,
    setSelectedDate,
    setSelectedClass,
    setSelectedSection,
    setRoster,
    updateStatus,
    markAll,
    updateRemarks,
    setIsSaving,
    setHasUnsavedChanges,
  } = useAttendanceStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  const getOfflineQueue = (): QueuedAttendance[] => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveOfflineQueue = (queue: QueuedAttendance[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      setOfflineQueueCount(queue.length);
    } catch (err) {
      console.error("Failed to update offline attendance queue:", err);
    }
  };

  const updateQueueCount = useCallback(() => {
    setOfflineQueueCount(getOfflineQueue().length);
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0 || isSyncingOffline) return;

    setIsSyncingOffline(true);
    const remaining: QueuedAttendance[] = [];

    for (const item of queue) {
      try {
        await attendanceRestApi.recordBulk({
          sectionId: item.sectionId,
          date: item.date,
          records: item.records,
        });
      } catch (err) {
        console.warn("Failed to sync queued item:", item.id, err);
        remaining.push(item);
      }
    }

    saveOfflineQueue(remaining);
    setIsSyncingOffline(false);
  }, [isSyncingOffline]);

  // Online / Offline listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    updateQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncOfflineQueue, updateQueueCount]);

  const ready = Boolean(
    schoolId && selectedClassId && selectedSectionId && selectedDate
  );

  const fetchRoster = useCallback(async () => {
    if (!ready || !selectedSectionId) return;
    setIsLoading(true);
    try {
      // 1. Fetch attendance recorded for this section & date
      const attendance = await attendanceRestApi.getByDate(selectedDate, selectedSectionId);
      // 2. Fetch active students in this section
      const students = await studentsRestApi.getAll({
        sectionId: selectedSectionId,
        status: "active",
      });

      const recordsMap = new Map<string, any>();
      if (Array.isArray(attendance)) {
        attendance.forEach((a) => {
          recordsMap.set(a.studentId, a);
        });
      }

      const mergedRoster = (students || []).map((s: any) => {
        const studentId = s.id || s._id;
        const existing = recordsMap.get(studentId);
        return {
          studentId,
          firstName: s.firstName || (s.fullName || "").split(" ")[0] || "Student",
          lastName: s.lastName || (s.fullName || "").split(" ").slice(1).join(" ") || "",
          rollNumber: s.rollNumber || "",
          status: (existing?.status?.toLowerCase() || "present") as "present" | "absent" | "late" | "excused",
          remarks: existing?.remarks || "",
        };
      });

      setRoster(mergedRoster);
    } catch (e) {
      console.warn("Attendance roster fetch notice:", e);
    } finally {
      setIsLoading(false);
    }
  }, [ready, selectedSectionId, selectedDate, setRoster]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const saveRoster = async () => {
    if (!ready || !selectedSectionId) return false;
    setIsSaving(true);

    const payload = {
      sectionId: selectedSectionId,
      date: selectedDate,
      records: roster.map((r) => ({
        studentId: r.studentId,
        status: r.status.toUpperCase(),
        remarks: r.remarks,
      })),
    };

    // If offline or network call fails, queue locally
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const queue = getOfflineQueue();
      queue.push({
        id: `offline_att_${Date.now()}`,
        ...payload,
        queuedAt: new Date().toISOString(),
      });
      saveOfflineQueue(queue);
      setHasUnsavedChanges(false);
      setIsSaving(false);
      return "offline";
    }

    try {
      await attendanceRestApi.recordBulk(payload);
      setHasUnsavedChanges(false);
      return true;
    } catch (err) {
      console.warn("Network error during save, falling back to offline queue:", err);
      const queue = getOfflineQueue();
      queue.push({
        id: `offline_att_${Date.now()}`,
        ...payload,
        queuedAt: new Date().toISOString(),
      });
      saveOfflineQueue(queue);
      setHasUnsavedChanges(false);
      return "offline";
    } finally {
      setIsSaving(false);
    }
  };

  const summary = {
    total: roster.length,
    present: roster.filter((r) => r.status === "present").length,
    absent: roster.filter((r) => r.status === "absent").length,
    late: roster.filter((r) => r.status === "late").length,
    excused: roster.filter((r) => r.status === "excused").length,
  };

  return {
    schoolId,
    selectedDate,
    selectedClassId,
    selectedSectionId,
    roster,
    summary,
    isLoading,
    isSaving,
    isOnline,
    offlineQueueCount,
    isSyncingOffline,
    syncOfflineQueue,
    hasUnsavedChanges,
    setSelectedDate,
    setSelectedClass,
    setSelectedSection,
    updateStatus,
    markAll,
    updateRemarks,
    saveRoster,
    refetch: fetchRoster,
  };
}
