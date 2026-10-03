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

const DAY_ENUM_TO_NUM: Record<string, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

const mapSlotData = (s: any) => {
  const dayNum =
    typeof s.dayOfWeek === "number"
      ? s.dayOfWeek
      : (DAY_ENUM_TO_NUM[String(s.dayOfWeek).toUpperCase()] ?? 0);

  return {
    ...s,
    _id: s.id || s._id,
    id: s.id || s._id,
    dayOfWeek: dayNum,
    period: s.periodNumber || s.period || 1,
    subjectName: s.subject?.name || s.subjectName || "Subject",
    teacherName: s.teacher?.fullName || s.teacherName || "",
  };
};

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
        setSlots(data.map(mapSlotData));
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
      subjectId: args.subjectId || undefined,
      subjectName: args.subjectName || undefined,
      teacherId: args.teacherId || undefined,
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
          setSlots(data.map(mapSlotData));
        } else if (data?.slots && Array.isArray(data.slots)) {
          setSlots(data.slots.map(mapSlotData));
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
