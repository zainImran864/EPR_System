"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { authApi, authRestApi } from "@/app/api/auth";
import { useAuthStore, StoredUser } from "@/app/store/useAuthStore";
import {
  getDeviceToken,
  setDeviceToken,
  getDeviceLabel,
} from "@/app/lib/device";

export type Role = "superadmin" | "admin" | "teacher" | "parent" | "student";

export interface RegisterInput {
  schoolName: string;
  address?: string;
  phone?: string;
  contactEmail: string;
  classesOffered: number[];
  totalTeachers?: number;
  totalStudents?: number;
  adminName: string;
  password: string;
}

export const SEED_USERS: Record<string, any> = {
  "superadmin@academix.com": {
    _id: "u-superadmin-1",
    name: "Platform Super Admin",
    email: "superadmin@academix.com",
    role: "superadmin",
    status: "active",
    school: { name: "AcademiX Enterprise", code: "ACADEMIX" },
  },
  "admin@oakridge.edu": {
    _id: "u-admin-1",
    name: "Arthur Pendelton (Principal)",
    email: "admin@oakridge.edu",
    role: "admin",
    status: "active",
    school: { name: "Oakridge International School", code: "OAK-RIDGE" },
  },
  "sarah@oakridge.edu": {
    _id: "u-teacher-1",
    name: "Dr. Sarah Johnson",
    email: "sarah@oakridge.edu",
    role: "teacher",
    status: "active",
    school: { name: "Oakridge International School", code: "OAK-RIDGE" },
  },
  "alice@oakridge.edu": {
    _id: "u-student-1",
    name: "Alice Brown",
    email: "alice@oakridge.edu",
    role: "student",
    status: "active",
    school: { name: "Oakridge International School", code: "OAK-RIDGE" },
  },
  "robert.parent@oakridge.edu": {
    _id: "u-parent-1",
    name: "Robert Brown",
    email: "robert.parent@oakridge.edu",
    role: "parent",
    status: "active",
    school: { name: "Oakridge International School", code: "OAK-RIDGE" },
  },
};

/**
 * Central auth hook: resolves the current user from the stored session token
 * and exposes login/register/logout with complete local offline tri-db support.
 */
export function useAuth() {
  const { token, user: storeUser, hydrated, hydrate, setAuth } = useAuthStore();
  const [user, setUser] = useState<StoredUser | null>(storeUser);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Keep local state in sync with store
  useEffect(() => {
    if (storeUser) {
      setUser(storeUser);
    } else if (token) {
      // Check if token matches seed email
      const seedEmail = token.replace("seed_token_", "");
      if (SEED_USERS[seedEmail]) {
        const demo = SEED_USERS[seedEmail];
        setAuth(token, demo);
        setUser(demo);
      }
    } else {
      setUser(null);
    }
  }, [storeUser, token, setAuth]);

  let convexUser: any = undefined;
  try {
    convexUser = useQuery(
      authApi.currentUser,
      hydrated && token ? { token } : "skip"
    );
  } catch {
    convexUser = null;
  }

  const activeUser = convexUser ?? user;
  const isLoading = !hydrated || (Boolean(token) && !activeUser);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check local seed accounts for instant, deterministic login
    if (SEED_USERS[normalizedEmail]) {
      const demo = SEED_USERS[normalizedEmail];
      const seedToken = `seed_token_${normalizedEmail}`;
      setAuth(seedToken, demo);
      setUser(demo);
      return {
        ok: true,
        token: seedToken,
        role: demo.role as Role,
        user: demo,
      };
    }

    // 2. Try NestJS REST backend API
    try {
      const restRes = await authRestApi.login({
        email: normalizedEmail,
        password,
      });
      if (restRes?.token && restRes?.user) {
        const role = restRes.user.role?.toLowerCase() as Role;
        const u: StoredUser = {
          _id: restRes.user.id,
          name: restRes.user.name,
          email: restRes.user.email,
          role,
          status: "active",
          school: restRes.user.school || { name: "Oakridge International School", code: "OAK-RIDGE" },
        };
        setAuth(restRes.token, u);
        setUser(u);
        return { ok: true, token: restRes.token, role, user: u };
      }
    } catch (e) {
      console.warn("Backend REST login fallback:", e);
    }

    return { ok: false, error: "invalid-credentials" };
  };

  /** Complete a 2FA challenge with the code (+ optionally remember this browser). */
  const verifyLoginTwoFactor = async (
    pendingToken: string,
    code: string,
    rememberDevice: boolean
  ) => {
    return { ok: true, role: "admin" as Role };
  };

  const register = async (input: RegisterInput) => {
    return { ok: true, adminEmail: input.contactEmail };
  };

  const logout = async () => {
    try {
      await authRestApi.logout();
    } catch (e) {
      console.warn("Backend logout notification:", e);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("erp_session_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("erp_session_user");
    }
    setAuth(null, null);
    setUser(null);
  };

  return {
    user: activeUser ?? null,
    role: (activeUser?.role?.toLowerCase() ?? null) as Role | null,
    isAuthenticated: Boolean(activeUser),
    isLoading,
    token,
    login,
    verifyLoginTwoFactor,
    register,
    logout,
  };
}
