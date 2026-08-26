"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { schoolsApi } from "@/app/api/schools";
import { useAppStore } from "@/app/store/useAppStore";

/**
 * Resolves the active tenant school from Convex and caches its real _id in the
 * app store so every other hook can scope its queries. Until this resolves,
 * dependent queries should pass "skip".
 */
export function useActiveSchool() {
  const school = useQuery(schoolsApi.getActive, {});
  const setSchoolId = useAppStore((s) => s.setSchoolId);

  useEffect(() => {
    if (school?._id) setSchoolId(school._id);
  }, [school?._id, setSchoolId]);

  return {
    school: school ?? null,
    schoolId: school?._id ?? null,
    isLoading: school === undefined,
    isEmpty: school === null,
  };
}
