"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { authApi } from "@/app/api/auth";
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

/**
 * Central auth hook: resolves the current user from the stored session token
 * and exposes login/register/logout. Convex reactivity keeps `user` live.
 */
export function useAuth() {
  const { token, hydrated, hydrate, setToken } = useAuthStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const user = useQuery(
    authApi.currentUser,
    hydrated ? { token: token ?? undefined } : "skip"
  );

  const loginMutation = useMutation(authApi.login);
  const registerMutation = useMutation(authApi.register);
  const logoutMutation = useMutation(authApi.logout);
  const verify2faMutation = useMutation(authApi.verifyLoginTwoFactor);

  const isLoading = !hydrated || user === undefined;

  const login = async (email: string, password: string) => {
    const res = await loginMutation({
      email,
      password,
      deviceToken: getDeviceToken() ?? undefined,
    });
    if (res.ok && res.token) setToken(res.token);
    return res;
  };

  /** Complete a 2FA challenge with the code (+ optionally remember this browser). */
  const verifyLoginTwoFactor = async (
    pendingToken: string,
    code: string,
    rememberDevice: boolean
  ) => {
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
  };

  const register = (input: RegisterInput) => registerMutation(input);

  const logout = async () => {
    if (token) {
      try {
        await logoutMutation({ token });
      } catch {
        /* ignore */
      }
    }
    setToken(null);
  };

  return {
    user: user ?? null,
    role: (user?.role ?? null) as Role | null,
    isAuthenticated: Boolean(user),
    isLoading,
    token,
    login,
    verifyLoginTwoFactor,
    register,
    logout,
  };
}
