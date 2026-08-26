"use client";

import { useQuery, useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { timetableApi } from "@/app/api/timetable";
import { useActiveSchool } from "./useActiveSchool";

export interface SetSlotArgs {
  classId: string;
  sectionId: string;
  dayOfWeek: number;
  period: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherId?: string;
  room?: string;
}

/** Section timetable for the admin builder + student/parent views. */
export function useSectionTimetable(classId?: string, sectionId?: string) {
  const { schoolId } = useActiveSchool();

  const slots = useQuery(
    timetableApi.getSection,
    schoolId && classId && sectionId
      ? {
          schoolId,
          classId: classId as Id<"classes">,
          sectionId: sectionId as Id<"sections">,
        }
      : "skip"
  );

  const setSlotMutation = useMutation(timetableApi.setSlot);
  const deleteSlotMutation = useMutation(timetableApi.deleteSlot);

  const setSlot = (args: SetSlotArgs) =>
    schoolId
      ? setSlotMutation({
          schoolId,
          ...args,
          classId: args.classId as Id<"classes">,
          sectionId: args.sectionId as Id<"sections">,
          teacherId: args.teacherId ? (args.teacherId as Id<"teachers">) : undefined,
        })
      : undefined;

  const deleteSlot = (slotId: string) =>
    deleteSlotMutation({ slotId: slotId as Id<"timetableSlots"> });

  return {
    slots: slots ?? [],
    isLoading: slots === undefined && Boolean(classId && sectionId),
    setSlot,
    deleteSlot,
  };
}

/** A teacher's own weekly timetable across all sections. */
export function useTeacherTimetable(teacherId?: string | null) {
  const { schoolId } = useActiveSchool();
  const slots = useQuery(
    timetableApi.getTeacher,
    schoolId && teacherId
      ? { schoolId, teacherId: teacherId as Id<"teachers"> }
      : "skip"
  );
  return { slots: slots ?? [], isLoading: slots === undefined && Boolean(teacherId) };
}
