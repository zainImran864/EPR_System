"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { teachersApi } from "@/app/api/teachers";
import { useActiveSchool } from "./useActiveSchool";
import { useDebounce } from "./useDebounce";

interface CreateTeacherArgs {
  firstName: string;
  lastName: string;
  employeeId: string;
  phone?: string;
  designation: string;
  department: string;
  joinDate?: string;
  status?: "active" | "inactive";
  password: string;
}

/**
 * Reactive teachers roster with local search/status filter state.
 */
export function useTeachers() {
  const { schoolId } = useActiveSchool();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "all">("all");

  const debouncedSearch = useDebounce(search, 250);

  const data = useQuery(
    teachersApi.list,
    schoolId
      ? {
          schoolId,
          status: status === "all" ? undefined : status,
          search: debouncedSearch || undefined,
        }
      : "skip"
  );

  const isLoading = schoolId === null || data === undefined;
  const teachers = data ?? [];

  const createMutation = useMutation(teachersApi.create);
  const updateStatusMutation = useMutation(teachersApi.updateStatus);

  const addTeacher = (args: CreateTeacherArgs) =>
    schoolId ? createMutation({ schoolId, ...args }) : undefined;

  const setTeacherStatus = (teacherId: string, next: "active" | "inactive") =>
    updateStatusMutation({ teacherId, status: next });

  return {
    teachers,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    addTeacher,
    setTeacherStatus,
  };
}
