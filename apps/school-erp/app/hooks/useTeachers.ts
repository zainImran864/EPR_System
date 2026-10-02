"use client";

import { useEffect, useState, useCallback } from "react";
import { teachersRestApi } from "@/app/api/client";
import { useActiveSchool } from "./useActiveSchool";
import { useDebounce } from "./useDebounce";

interface CreateTeacherArgs {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  designation?: string;
  department?: string;
  qualification?: string;
  specialization?: string;
  joinDate?: string;
  status?: "active" | "inactive";
  password?: string;
  email?: string;
  personalEmail?: string;
}

/**
 * REST-powered reactive teachers roster with search, filter, and mutations
 * backed by NestJS, PostgreSQL & Redis.
 */
export function useTeachers() {
  const { schoolId } = useActiveSchool();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "all">("all");
  const [rawTeachers, setRawTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 250);

  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await teachersRestApi.getAll();
      if (Array.isArray(data)) {
        const normalized = data.map((t) => {
          const parts = (t.fullName || "").split(" ");
          return {
            ...t,
            _id: t.id || t._id,
            firstName: t.firstName || parts[0] || "",
            lastName: t.lastName || parts.slice(1).join(" ") || "",
            department: t.department || t.specialization || "General",
          };
        });
        setRawTeachers(normalized);
      }
    } catch (e) {
      console.warn("REST teachers fetch notice:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers, schoolId]);

  const addTeacher = async (args: CreateTeacherArgs) => {
    const fullName = args.fullName || `${args.firstName || ""} ${args.lastName || ""}`.trim();
    const res = await teachersRestApi.create({
      fullName,
      email: args.email || args.personalEmail || `${(args.firstName || "teacher").toLowerCase()}@oakridge.edu`,
      phone: args.phone,
      qualification: args.qualification || args.designation,
      designation: args.designation || "Teacher",
      specialization: args.department || args.specialization,
      password: args.password,
    });
    await fetchTeachers();
    return res;
  };

  const editTeacher = async (teacherId: string, args: any) => {
    const res = await teachersRestApi.update(teacherId, args);
    await fetchTeachers();
    return res;
  };

  const setTeacherStatus = async (teacherId: string, next: "active" | "inactive") => {
    const res = await teachersRestApi.update(teacherId, { status: next });
    await fetchTeachers();
    return res;
  };

  const removeTeacher = async (teacherId: string) => {
    const res = await teachersRestApi.delete(teacherId);
    await fetchTeachers();
    return res;
  };

  const filteredTeachers = rawTeachers.filter((t) => {
    if (status !== "all" && (t.status || "active") !== status) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const match =
        t.fullName?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.employeeId?.toLowerCase().includes(q) ||
        t.designation?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return {
    teachers: filteredTeachers,
    allTeachers: rawTeachers,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    refetch: fetchTeachers,
    addTeacher,
    editTeacher,
    setTeacherStatus,
    removeTeacher,
  };
}
