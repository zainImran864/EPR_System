"use client";

import { useEffect } from "react";
import { useCurrencyStore, CURRENCY_PRESETS } from "@/app/store/useCurrencyStore";

export function useCurrency() {
  const {
    currencySymbol,
    currencyCode,
    schoolStartTime,
    schoolEndTime,
    setCurrency,
    setSchoolHours,
    format,
    init,
  } = useCurrencyStore();

  useEffect(() => {
    init();
  }, [init]);

  return {
    currencySymbol,
    currencyCode,
    schoolStartTime,
    schoolEndTime,
    setCurrency,
    setSchoolHours,
    formatCurrency: format,
    presets: CURRENCY_PRESETS,
  };
}
