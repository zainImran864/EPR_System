"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { applyThemeColor, DEFAULT_THEME } from "@/app/lib/theme";

/**
 * Once the session resolves, apply the user's saved sidebar colour (the
 * authoritative DB value), overriding the cached one. Runs invisibly.
 */
export function ThemeSync() {
  const { user } = useAuth();
  const theme = user?.themeColor ?? null;

  useEffect(() => {
    if (user) applyThemeColor(theme || DEFAULT_THEME);
  }, [user, theme]);

  return null;
}
