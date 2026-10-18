"use client";

import { create } from "zustand";
import { schoolsRestApi } from "@/app/api/client";

const SYMBOL_KEY = "erp_school_currency_symbol";
const CODE_KEY = "erp_school_currency_code";
const START_TIME_KEY = "erp_school_start_time";
const END_TIME_KEY = "erp_school_end_time";

export const CURRENCY_PRESETS = [
  { symbol: "$", code: "USD", label: "US Dollar ($ USD)" },
  { symbol: "Rs", code: "PKR", label: "Pakistani Rupee (Rs PKR)" },
  { symbol: "€", code: "EUR", label: "Euro (€ EUR)" },
  { symbol: "£", code: "GBP", label: "British Pound (£ GBP)" },
  { symbol: "₹", code: "INR", label: "Indian Rupee (₹ INR)" },
  { symbol: "AED", code: "AED", label: "UAE Dirham (AED)" },
  { symbol: "SAR", code: "SAR", label: "Saudi Riyal (SAR)" },
  { symbol: "C$", code: "CAD", label: "Canadian Dollar (C$ CAD)" },
  { symbol: "A$", code: "AUD", label: "Australian Dollar (A$ AUD)" },
];

interface CurrencyStoreState {
  currencySymbol: string;
  currencyCode: string;
  schoolStartTime: string;
  schoolEndTime: string;
  initialized: boolean;
  setCurrency: (symbol: string, code: string) => void;
  setSchoolHours: (start: string, end: string) => void;
  format: (amount: number | string | null | undefined) => string;
  init: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyStoreState>((set, get) => ({
  currencySymbol: "$",
  currencyCode: "USD",
  schoolStartTime: "07:30",
  schoolEndTime: "14:00",
  initialized: false,

  setCurrency: (currencySymbol: string, currencyCode: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SYMBOL_KEY, currencySymbol);
      localStorage.setItem(CODE_KEY, currencyCode);
    }
    set({ currencySymbol, currencyCode });
  },

  setSchoolHours: (schoolStartTime: string, schoolEndTime: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(START_TIME_KEY, schoolStartTime);
      localStorage.setItem(END_TIME_KEY, schoolEndTime);
    }
    set({ schoolStartTime, schoolEndTime });
  },

  format: (amount: number | string | null | undefined) => {
    const sym = get().currencySymbol || "$";
    const num = Number(amount ?? 0);
    const formatted = isNaN(num) ? "0" : num.toLocaleString();
    return `${sym} ${formatted}`;
  },

  init: async () => {
    if (get().initialized) return;

    let initialSymbol = "$";
    let initialCode = "USD";
    let initialStart = "07:30";
    let initialEnd = "14:00";

    if (typeof window !== "undefined") {
      const savedSymbol = localStorage.getItem(SYMBOL_KEY);
      const savedCode = localStorage.getItem(CODE_KEY);
      const savedStart = localStorage.getItem(START_TIME_KEY);
      const savedEnd = localStorage.getItem(END_TIME_KEY);

      if (savedSymbol) initialSymbol = savedSymbol;
      if (savedCode) initialCode = savedCode;
      if (savedStart) initialStart = savedStart;
      if (savedEnd) initialEnd = savedEnd;
    }

    set({
      currencySymbol: initialSymbol,
      currencyCode: initialCode,
      schoolStartTime: initialStart,
      schoolEndTime: initialEnd,
      initialized: true,
    });

    try {
      const school = await schoolsRestApi.getCurrentSchool();
      if (school) {
        const symbol = school.currencySymbol || initialSymbol;
        const code = school.currencyCode || initialCode;
        const start = school.schoolStartTime || initialStart;
        const end = school.schoolEndTime || initialEnd;

        if (typeof window !== "undefined") {
          localStorage.setItem(SYMBOL_KEY, symbol);
          localStorage.setItem(CODE_KEY, code);
          localStorage.setItem(START_TIME_KEY, start);
          localStorage.setItem(END_TIME_KEY, end);
        }

        set({
          currencySymbol: symbol,
          currencyCode: code,
          schoolStartTime: start,
          schoolEndTime: end,
        });
      }
    } catch {
      // Offline fallback: keep cached values
    }
  },
}));
