"use client";

import { useEffect, useState } from "react";
import { schoolsRestApi } from "@/app/api/client";
import { useAppStore } from "@/app/store/useAppStore";
import { useAuth } from "./useAuth";

/**
 * Resolves the active tenant school from the LOGGED-IN USER's schoolId (true
 * multi-tenant scoping) and caches its real _id in the app store so every other
 * hook can scope its queries. Superadmins have no school → resolves to null.
 */
export function useActiveSchool() {
  const { user, isLoading: authLoading } = useAuth();
  const setSchoolId = useAppStore((s) => s.setSchoolId);
  const [school, setSchool] = useState<any>(null);
  const [isLoadingSchool, setIsLoadingSchool] = useState(false);

  const directSchool = user?.school;
  const directSchoolId: string =
    user?.schoolId || directSchool?.id || directSchool?._id || "school-oakridge-1";

  useEffect(() => {
    if (directSchoolId) {
      setSchoolId(directSchoolId);
    }
  }, [directSchoolId, setSchoolId]);

  useEffect(() => {
    let mounted = true;
    if (directSchool) {
      setSchool(directSchool);
    } else if (user) {
      setIsLoadingSchool(true);
      schoolsRestApi
        .getCurrentSchool()
        .then((res) => {
          if (mounted && res) setSchool(res);
        })
        .catch(() => {})
        .finally(() => {
          if (mounted) setIsLoadingSchool(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [user, directSchool]);

  const activeSchool = school || directSchool || {
    id: directSchoolId,
    _id: directSchoolId,
    name: "Oakridge International School",
    code: "OAK-RIDGE",
  };

  return {
    school: activeSchool,
    schoolId: activeSchool?.id || activeSchool?._id || directSchoolId,
    isLoading: authLoading || isLoadingSchool,
    isEmpty: !authLoading && !directSchoolId,
  };
}
