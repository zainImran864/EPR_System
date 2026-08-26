"use client";

import { create } from "zustand";

const TOKEN_KEY = "erp_session_token";

interface AuthStoreState {
  token: string | null;
  hydrated: boolean;
  setToken: (token: string | null) => void;
  hydrate: () => void;
}

/**
 * Holds the opaque session token, mirrored to localStorage so the session
 * survives reloads. `hydrated` gates queries until we've read localStorage.
 */
export const useAuthStore = create<AuthStoreState>((set) => ({
  token: null,
  hydrated: false,
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    }
    set({ token });
  },
  hydrate: () => {
    if (typeof window !== "undefined") {
      set({ token: localStorage.getItem(TOKEN_KEY), hydrated: true });
    } else {
      set({ hydrated: true });
    }
  },
}));
