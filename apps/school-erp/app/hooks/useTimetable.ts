"use client";

import { useEffect, useState, useCallback } from "react";
import { timetableRestApi } from "@/app/api/client";
import { useActiveSchool } from "./useActiveSchool";

export interface SetSlotArgs {
  classId?: string;
  sectionId: string;
  dayOfWeek: string | number;
  period?: number;
  periodNumber?: number;
  startTime: string;
  endTime: string;
  subjectId?: string;
  subjectName?: string;
  teacherId?: string;
  room?: string;
  allowCombinedClass?: boolean;
  allowSharedRoom?: boolean;
}

/** Section timetable for the admin builder + student/parent views. */
export function useSectionTimetable(classId?: string, sectionId?: string) {
  const { schoolId } = useActiveSchool();
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!sectionId) return;
    setIsLoading(true);
    try {
      const data = await timetableRestApi.getSectionTimetable(sectionId);
      if (Array.isArray(data)) {
        setSlots(data.map((s) => ({ ...s, _id: s.id || s._id })));
      }
    } catch (e) {
      console.warn("Section timetable fetch notice:", e);
    } finally {
      setIsLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots, schoolId]);

  const setSlot = async (args: SetSlotArgs) => {
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    const dayStr =
      typeof args.dayOfWeek === "number"
        ? days[args.dayOfWeek] || "MONDAY"
        : String(args.dayOfWeek).toUpperCase();

    const res = await timetableRestApi.createEntry({
      sectionId: args.sectionId,
      subjectId: args.subjectId || "subject-general-1",
      teacherId: args.teacherId || "teacher-1",
      dayOfWeek: dayStr,
      periodNumber: args.period || args.periodNumber || 1,
      startTime: args.startTime,
      endTime: args.endTime,
      room: args.room,
      allowCombinedClass: args.allowCombinedClass,
      allowSharedRoom: args.allowSharedRoom,
    });
    await fetchSlots();
    return res;
  };

  const deleteSlot = async (slotId: string) => {
    const res = await timetableRestApi.deleteEntry(slotId);
    await fetchSlots();
    return res;
  };

  return {
    slots,
    isLoading,
    setSlot,
    deleteSlot,
    refetch: fetchSlots,
  };
}

/** A teacher's own weekly timetable across all sections. */
export function useTeacherTimetable(teacherId?: string | null) {
  const { schoolId } = useActiveSchool();
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    const fetcher = teacherId
      ? timetableRestApi.getTeacherTimetable(teacherId)
      : timetableRestApi.getMyTimetable();

    fetcher
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          setSlots(data.map((s) => ({ ...s, _id: s.id || s._id })));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [teacherId, schoolId]);

  return { slots, isLoading };
}
