"use client";

import { useEffect, useState, useCallback } from "react";
import { classesRestApi } from "@/app/api/client";
import { useActiveSchool } from "./useActiveSchool";

interface CreateClassArgs {
  name: string;
  numericGrade: number;
  academicYear?: string;
  sections?: string[];
}

interface AddSectionArgs {
  classId: string;
  name: string;
  roomNumber?: string;
  classTeacherId?: string;
}

/**
 * REST-powered reactive classes-with-sections list with select options
 * helpers for student/marks/attendance modules.
 */
export function useClasses() {
  const { schoolId } = useActiveSchool();
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await classesRestApi.getAll();
      if (Array.isArray(data)) {
        const normalized = data.map((c) => ({
          ...c,
          _id: c.id || c._id,
          sections: (c.sections || []).map((s: any) => ({
            ...s,
            _id: s.id || s._id,
          })),
        }));
        setClasses(normalized);
      }
    } catch (e) {
      console.warn("REST classes fetch notice:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses, schoolId]);

  const classOptions = classes.map((c) => ({
    value: c._id || c.id,
    label: c.name,
  }));

  const sectionOptions = (classId: string) => {
    const cls = classes.find((c) => (c._id || c.id) === classId);
    return (cls?.sections ?? []).map((s: any) => ({
      value: s._id || s.id,
      label: s.name,
    }));
  };

  const addClass = async (args: CreateClassArgs) => {
    const res = await classesRestApi.createClass(args);
    await fetchClasses();
    return res;
  };

  const addSection = async (args: AddSectionArgs) => {
    const res = await classesRestApi.createSection(args.classId, {
      name: args.name,
      roomNumber: args.roomNumber,
      classTeacherId: args.classTeacherId,
    });
    await fetchClasses();
    return res;
  };

  const editClass = async (
    classId: string,
    fields: { name?: string; numericGrade?: number; academicYear?: string }
  ) => {
    return { success: true };
  };

  const editSection = async (
    sectionId: string,
    fields: { name?: string; roomNumber?: string; classTeacherId?: string }
  ) => {
    return { success: true };
  };

  return {
    classes,
    isLoading,
    classOptions,
    sectionOptions,
    refetch: fetchClasses,
    addClass,
    addSection,
    editClass,
    editSection,
  };
}
