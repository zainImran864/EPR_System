"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { studentsRestApi } from "@/app/api/client";
import { useStudentStore } from "@/app/store/useStudentStore";
import { useActiveSchool } from "./useActiveSchool";
import { useDebounce } from "./useDebounce";
import type { CreateStudentInput } from "@/app/types/student";
import type { Status } from "@/app/types/common";

/**
 * REST-powered reactive students roster with server-side filtering,
 * pagination, and mutations backed by PostgreSQL + Redis.
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

  const [rawStudents, setRawStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(filters.search, 250);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await studentsRestApi.getAll({
        classId: filters.classId || undefined,
        sectionId: filters.sectionId || undefined,
        status: filters.status || undefined,
        search: debouncedSearch || undefined,
      });
      if (Array.isArray(data)) {
        // Normalize fields for frontend compatibility
        const normalized = data.map((s) => ({
          ...s,
          _id: s.id || s._id,
          className: s.className || s.class?.name || "",
          sectionName: s.sectionName || s.section?.name || "",
          guardianName: s.guardianName || s.parent?.fullName || "",
          guardianPhone: s.guardianPhone || s.parent?.phone || "",
          guardianEmail: s.guardianEmail || s.parent?.email || "",
        }));
        setRawStudents(normalized);
      }
    } catch (e) {
      console.warn("REST students fetch notice:", e);
    } finally {
      setIsLoading(false);
    }
  }, [filters.classId, filters.sectionId, filters.status, debouncedSearch]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents, schoolId]);

  const addStudent = async (input: CreateStudentInput) => {
    const res = await studentsRestApi.create(input);
    await fetchStudents();
    return res;
  };

  const editStudent = async (studentId: string, fields: any) => {
    const res = await studentsRestApi.update(studentId, fields);
    await fetchStudents();
    return res;
  };

  const setStudentStatus = async (studentId: string, status: Status) => {
    const res = await studentsRestApi.update(studentId, { status });
    await fetchStudents();
    return res;
  };

  const removeStudent = async (studentId: string) => {
    const res = await studentsRestApi.delete(studentId);
    await fetchStudents();
    return res;
  };

  const totalItems = rawStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedStudents = useMemo(() => {
    return rawStudents.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [rawStudents, currentPage, pageSize]);

  return {
    students: paginatedStudents,
    allStudents: rawStudents,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    filters,
    isLoading,
    selectedStudent,
    refetch: fetchStudents,
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
