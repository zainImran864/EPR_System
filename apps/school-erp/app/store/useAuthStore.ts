"use client";

import { create } from "zustand";

const TOKEN_KEY = "erp_session_token";
const USER_KEY = "erp_session_user";

export interface StoredUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  status: string;
  schoolId?: string;
  school?: {
    id?: string;
    _id?: string;
    name: string;
    code: string;
    logoUrl?: string | null;
  };
  phone?: string;
  themeColor?: string;
  twoFactorEnabled?: boolean;
  notificationsEnabled?: boolean;
  avatarUrl?: string | null;
  linkedTeacherId?: string;
  linkedStudentId?: string;
  studentContext?: {
    studentId: string;
    classId: string;
    sectionId: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    className?: string;
    sectionName?: string;
    admissionNumber?: string;
    rollNumber?: string;
  };
}

interface AuthStoreState {
  token: string | null;
  user: StoredUser | null;
  hydrated: boolean;
  setAuth: (token: string | null, user: StoredUser | null) => void;
  setToken: (token: string | null) => void;
  setUser: (user: StoredUser | null) => void;
  hydrate: () => void;
}

/**
 * Holds the authenticated session token & user, mirrored to localStorage so the session
 * survives reloads without any redirect jitter or loops.
 */
export const useAuthStore = create<AuthStoreState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  setAuth: (token, user) => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("auth_token");
      }

      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    }
    set({ token, user });
  },
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("auth_token");
      }
    }
    set({ token });
  },
  setUser: (user) => {
    if (typeof window !== "undefined") {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    }
    set({ user });
  },
  hydrate: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(TOKEN_KEY);
      let user: StoredUser | null = null;
      try {
        const rawUser = localStorage.getItem(USER_KEY);
        if (rawUser) user = JSON.parse(rawUser);
      } catch {}
      set({ token, user, hydrated: true });
    } else {
      set({ hydrated: true });
    }
  },
}));
