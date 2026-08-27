"use client";

import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { studentsApi } from "@/app/api/students";
import { useStudentStore } from "@/app/store/useStudentStore";
import { useActiveSchool } from "./useActiveSchool";
import { useDebounce } from "./useDebounce";
import type { CreateStudentInput } from "@/app/types/student";
import type { Status } from "@/app/types/common";

/**
 * Client-side reactive students list. Query args are driven by the Zustand
 * store (filters + pagination); Convex reactivity keeps the list live after
 * mutations, so no manual refetch is needed.
 */
export function useStudents() {
  const { schoolId } = useActiveSchool();
  const {
    filters,
    currentPage,
    pageSize,
    selectedStudent,
    setFilters,
    setCurrentPage,
    setPageSize,
    setSelectedStudent,
  } = useStudentStore();

  const debouncedSearch = useDebounce(filters.search, 250);

  const data = useQuery(
    studentsApi.list,
    schoolId
      ? {
          schoolId,
          classId: filters.classId || undefined,
          sectionId: filters.sectionId || undefined,
          status: filters.status || undefined,
          search: debouncedSearch || undefined,
        }
      : "skip"
  );

  const isLoading = schoolId === null || data === undefined;
  const students = useMemo(() => data ?? [], [data]);

  const createStudentMutation = useMutation(studentsApi.create);
  const updateStudentMutation = useMutation(studentsApi.update);
  const updateStatusMutation = useMutation(studentsApi.updateStatus);
  const removeStudentMutation = useMutation(studentsApi.remove);

  const addStudent = async (input: CreateStudentInput) => {
    if (!schoolId) return;
    return createStudentMutation({ schoolId, ...input });
  };

  const editStudent = (
    studentId: string,
    fields: {
      firstName?: string;
      lastName?: string;
      rollNumber?: string;
      classId?: string;
      sectionId?: string;
      gender?: "male" | "female" | "other";
      guardianName?: string;
      guardianPhone?: string;
      guardianEmail?: string;
      status?: Status;
    }
  ) => updateStudentMutation({ studentId, ...fields });

  const setStudentStatus = (studentId: string, status: Status) =>
    updateStatusMutation({ studentId, status });

  const removeStudent = (studentId: string) => removeStudentMutation({ studentId });

  const totalItems = students.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedStudents = students.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return {
    students: paginatedStudents,
    allStudents: students,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    filters,
    isLoading,
    selectedStudent,
    addStudent,
    editStudent,
    setStudentStatus,
    removeStudent,
    setFilters,
    setCurrentPage,
    setPageSize,
    setSelectedStudent,
  };
}
