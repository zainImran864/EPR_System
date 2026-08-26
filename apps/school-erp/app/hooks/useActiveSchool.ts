"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { schoolsApi } from "@/app/api/schools";
import { useAppStore } from "@/app/store/useAppStore";
import { useAuth } from "./useAuth";

/**
 * Resolves the active tenant school from the LOGGED-IN USER's schoolId (true
 * multi-tenant scoping) and caches its real _id in the app store so every other
 * hook can scope its queries. Superadmins have no school → resolves to null.
 */
export function useActiveSchool() {
  const { user, isLoading: authLoading } = useAuth();
  const schoolId = user?.schoolId ?? null;

  const school = useQuery(schoolsApi.getById, schoolId ? { schoolId } : "skip");
  const setSchoolId = useAppStore((s) => s.setSchoolId);

  useEffect(() => {
    if (school?._id) setSchoolId(school._id);
  }, [school?._id, setSchoolId]);

  const isLoading = authLoading || (schoolId !== null && school === undefined);

  return {
    school: school ?? null,
    schoolId: school?._id ?? null,
    isLoading,
    isEmpty: !authLoading && schoolId === null,
  };
}
