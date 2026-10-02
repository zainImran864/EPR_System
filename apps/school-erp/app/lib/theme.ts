/**
 * Per-user sidebar accent theme. Applied via the `--sidebar-accent` CSS variable
 * and cached in localStorage so a returning user sees their colour INSTANTLY on
 * load (the inline script in app/layout.tsx reads the cache before first paint),
 * then it's reconciled with the DB value once the session resolves.
 */

export const DEFAULT_THEME = "#0D9488";

export const THEME_OPTIONS = [
  { name: "Teal", hex: "#0D9488" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Indigo", hex: "#4F46E5" },
  { name: "Emerald", hex: "#059669" },
  { name: "Crimson", hex: "#DC2626" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Amber", hex: "#D97706" },
  { name: "Slate", hex: "#334155" },
];

export const THEME_STORAGE_KEY = "academix_theme";

/** Set the live CSS variable + cache the colour for the next instant load. */
export function applyThemeColor(hex: string): void {
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--sidebar-accent", hex);
  }
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, hex);
  } catch {
    /* ignore */
  }
}

export function getCachedTheme(): string | null {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Inline script (runs before paint) that applies the cached colour. */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t){document.documentElement.style.setProperty('--sidebar-accent',t)}}catch(e){}`;
