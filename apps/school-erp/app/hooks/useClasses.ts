"use client";

import { useQuery, useMutation } from "convex/react";
import { classesApi } from "@/app/api/classes";
import { useActiveSchool } from "./useActiveSchool";

interface CreateClassArgs {
  name: string;
  numericGrade: number;
  academicYear: string;
  sections: string[];
}

interface AddSectionArgs {
  classId: string;
  name: string;
  roomNumber?: string;
  classTeacherId?: string;
}

/**
 * Reactive classes-with-sections list. Also exposes select option helpers so
 * every module (students / attendance / marks) can share the same class and
 * section pickers backed by real Convex ids.
 */
export function useClasses() {
  const { schoolId } = useActiveSchool();

  const data = useQuery(
    classesApi.listWithSections,
    schoolId ? { schoolId } : "skip"
  );
  const isLoading = schoolId === null || data === undefined;
  const classes = data ?? [];

  const createClassMutation = useMutation(classesApi.create);
  const addSectionMutation = useMutation(classesApi.addSection);

  const classOptions = classes.map((c) => ({ value: c._id, label: c.name }));

  const sectionOptions = (classId: string) => {
    const cls = classes.find((c) => c._id === classId);
    return (cls?.sections ?? []).map((s) => ({ value: s._id, label: s.name }));
  };

  const addClass = (args: CreateClassArgs) =>
    schoolId ? createClassMutation({ schoolId, ...args }) : undefined;

  const addSection = (args: AddSectionArgs) =>
    schoolId ? addSectionMutation({ schoolId, ...args }) : undefined;

  return {
    classes,
    isLoading,
    classOptions,
    sectionOptions,
    addClass,
    addSection,
  };
}
