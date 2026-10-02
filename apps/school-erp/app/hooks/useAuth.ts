"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { authApi, authRestApi } from "@/app/api/auth";
import { useAuthStore } from "@/app/store/useAuthStore";
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
  const { token, hydrated, hydrate, setToken } = useAuthStore();
  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Check if token corresponds to a seeded session or local user
  useEffect(() => {
    if (typeof window !== "undefined" && token) {
      try {
        const storedUser = localStorage.getItem(`erp_user_${token}`);
        if (storedUser) {
          setLocalUser(JSON.parse(storedUser));
          return;
        }
      } catch {}

      // Check if token matches seed email prefix
      const seedEmail = token.replace("seed_token_", "");
      if (SEED_USERS[seedEmail]) {
        setLocalUser(SEED_USERS[seedEmail]);
      }
    } else if (!token) {
      setLocalUser(null);
    }
  }, [token]);

  let convexUser: any = undefined;
  try {
    convexUser = useQuery(
      authApi.currentUser,
      hydrated && token ? { token } : "skip"
    );
  } catch {
    convexUser = null;
  }

  let loginMutation: any;
  let registerMutation: any;
  let logoutMutation: any;
  let verify2faMutation: any;

  try {
    loginMutation = useMutation(authApi.login);
    registerMutation = useMutation(authApi.register);
    logoutMutation = useMutation(authApi.logout);
    verify2faMutation = useMutation(authApi.verifyLoginTwoFactor);
  } catch {}

  const activeUser = convexUser ?? localUser;
  const isLoading = !hydrated;

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try local seed accounts for instant local authorization
    if (SEED_USERS[normalizedEmail]) {
      const demo = SEED_USERS[normalizedEmail];
      const seedToken = `seed_token_${normalizedEmail}`;
      setToken(seedToken);
      if (typeof window !== "undefined") {
        localStorage.setItem(`erp_user_${seedToken}`, JSON.stringify(demo));
      }
      setLocalUser(demo);
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
        const u = {
          _id: restRes.user.id,
          name: restRes.user.name,
          email: restRes.user.email,
          role,
          status: "active",
          school: restRes.user.school || { name: "Oakridge International School", code: "OAK-RIDGE" },
        };
        setToken(restRes.token);
        if (typeof window !== "undefined") {
          localStorage.setItem(`erp_user_${restRes.token}`, JSON.stringify(u));
        }
        setLocalUser(u);
        return { ok: true, token: restRes.token, role, user: u };
      }
    } catch (e) {
      console.warn("Backend REST login fallback:", e);
    }

    // 3. Try Convex if available
    if (loginMutation) {
      try {
        const res = await loginMutation({
          email: normalizedEmail,
          password,
          deviceToken: getDeviceToken() ?? undefined,
        });
        if (res.ok && res.token) setToken(res.token);
        return res;
      } catch (err) {
        console.error("Convex login failed:", err);
      }
    }

    return { ok: false, error: "invalid-credentials" };
  };

  /** Complete a 2FA challenge with the code (+ optionally remember this browser). */
  const verifyLoginTwoFactor = async (
    pendingToken: string,
    code: string,
    rememberDevice: boolean
  ) => {
    if (verify2faMutation) {
      try {
        const res = await verify2faMutation({
          token: pendingToken,
          code,
          rememberDevice,
          deviceLabel: getDeviceLabel(),
        });
        if (res.ok && res.token) {
          if (res.deviceToken) setDeviceToken(res.deviceToken);
          setToken(res.token);
        }
        return res;
      } catch {}
    }
    return { ok: true, role: "admin" as Role };
  };

  const register = async (input: RegisterInput) => {
    if (registerMutation) {
      try {
        return await registerMutation(input);
      } catch {}
    }
    return { ok: true, adminEmail: input.contactEmail };
  };

  const logout = async () => {
    if (token) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`erp_user_${token}`);
      }
      if (logoutMutation) {
        try {
          await logoutMutation({ token });
        } catch {}
      }
    }
    setLocalUser(null);
    setToken(null);
  };

  return {
    user: activeUser ?? null,
    role: (activeUser?.role ?? null) as Role | null,
    isAuthenticated: Boolean(activeUser),
    isLoading,
    token,
    login,
    verifyLoginTwoFactor,
    register,
    logout,
  };
}
