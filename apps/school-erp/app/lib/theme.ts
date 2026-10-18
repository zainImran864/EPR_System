/**
 * Per-user / per-school brand & sidebar accent theme.
 * Applied via `--sidebar-accent` and `--color-primary-*` CSS variables
 * and cached in localStorage so a returning user sees their colour INSTANTLY on
 * load (the inline script in app/layout.tsx reads the cache before first paint),
 * then it's reconciled with the DB value once the session resolves.
 */

export const DEFAULT_THEME = "#0D9488";

export interface ThemePalette {
  name: string;
  hex: string;
  ramp: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

export const THEME_OPTIONS: ThemePalette[] = [
  {
    name: "Teal",
    hex: "#0D9488",
    ramp: {
      50: "#F0FDFA",
      100: "#CCFBF1",
      200: "#99F6E4",
      300: "#5EEAD4",
      400: "#2DD4BF",
      500: "#14B8A6",
      600: "#0D9488",
      700: "#0F766E",
      800: "#115E59",
      900: "#134E4A",
    },
  },
  {
    name: "Royal Blue",
    hex: "#2563EB",
    ramp: {
      50: "#EFF6FF",
      100: "#DBEAFE",
      200: "#BFDBFE",
      300: "#93C5FD",
      400: "#60A5FA",
      500: "#3B82F6",
      600: "#2563EB",
      700: "#1D4ED8",
      800: "#1E40AF",
      900: "#1E3A8A",
    },
  },
  {
    name: "Indigo",
    hex: "#4F46E5",
    ramp: {
      50: "#EEF2FF",
      100: "#E0E7FF",
      200: "#C7D2FE",
      300: "#A5B4FC",
      400: "#818CF8",
      500: "#6366F1",
      600: "#4F46E5",
      700: "#4338CA",
      800: "#3730A3",
      900: "#312E81",
    },
  },
  {
    name: "Emerald",
    hex: "#059669",
    ramp: {
      50: "#ECFDF5",
      100: "#D1FAE5",
      200: "#A7F3D0",
      300: "#6EE7B7",
      400: "#34D399",
      500: "#10B981",
      600: "#059669",
      700: "#047857",
      800: "#065F46",
      900: "#064E3B",
    },
  },
  {
    name: "Crimson",
    hex: "#DC2626",
    ramp: {
      50: "#FEF2F2",
      100: "#FEE2E2",
      200: "#FECACA",
      300: "#FCA5A5",
      400: "#F87171",
      500: "#EF4444",
      600: "#DC2626",
      700: "#B91C1C",
      800: "#991B1B",
      900: "#7F1D1D",
    },
  },
  {
    name: "Violet",
    hex: "#7C3AED",
    ramp: {
      50: "#F5F3FF",
      100: "#EDE9FE",
      200: "#DDD6FE",
      300: "#C4B5FD",
      400: "#A78BFA",
      500: "#8B5CF6",
      600: "#7C3AED",
      700: "#6D28D9",
      800: "#5B21B6",
      900: "#4C1D95",
    },
  },
  {
    name: "Amber",
    hex: "#D97706",
    ramp: {
      50: "#FFFBEB",
      100: "#FEF3C7",
      200: "#FDE68A",
      300: "#FCD34D",
      400: "#FBBF24",
      500: "#F59E0B",
      600: "#D97706",
      700: "#B45309",
      800: "#92400E",
      900: "#78350F",
    },
  },
  {
    name: "Slate",
    hex: "#334155",
    ramp: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#334155",
      700: "#1E293B",
      800: "#0F172A",
      900: "#020617",
    },
  },
];

export const THEME_STORAGE_KEY = "academix_theme";

/** Set the live CSS variables + cache the colour for the next instant load. */
export function applyThemeColor(hex: string): void {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.style.setProperty("--sidebar-accent", hex);
    const match = THEME_OPTIONS.find((t) => t.hex.toLowerCase() === hex.toLowerCase());
    if (match) {
      Object.entries(match.ramp).forEach(([shade, value]) => {
        root.style.setProperty(`--color-primary-${shade}`, value);
      });
    } else {
      root.style.setProperty("--color-primary-600", hex);
      root.style.setProperty("--color-primary-700", hex);
    }
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

/** Inline script (runs before paint) that applies the cached colour and its shade ramp. */
const SERIALIZED_RAMPS = JSON.stringify(
  Object.fromEntries(THEME_OPTIONS.map((t) => [t.hex.toLowerCase(), t.ramp]))
);

export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t){var r=document.documentElement.style;r.setProperty('--sidebar-accent',t);var m=${SERIALIZED_RAMPS}[t.toLowerCase()];if(m){for(var k in m){r.setProperty('--color-primary-'+k,m[k])}}}}catch(e){}`;

