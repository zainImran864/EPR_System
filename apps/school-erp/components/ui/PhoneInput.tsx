"use client";

import React, { useState, useEffect } from "react";
import { Phone, CheckCircle2, AlertCircle } from "lucide-react";

export interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
  digits: number; // expected national number length
  formatPlaceholder: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "PK", dialCode: "+92", name: "Pakistan", flag: "🇵🇰", digits: 10, formatPlaceholder: "300 1234567" },
  { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸", digits: 10, formatPlaceholder: "555 123 4567" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧", digits: 10, formatPlaceholder: "7123 456789" },
  { code: "AE", dialCode: "+971", name: "UAE", flag: "🇦🇪", digits: 9, formatPlaceholder: "50 123 4567" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia", flag: "🇸🇦", digits: 9, formatPlaceholder: "50 123 4567" },
  { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳", digits: 10, formatPlaceholder: "98765 43210" },
  { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦", digits: 10, formatPlaceholder: "555 123 4567" },
  { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺", digits: 9, formatPlaceholder: "412 345 678" },
  { code: "DE", dialCode: "+49", name: "Germany", flag: "🇩🇪", digits: 10, formatPlaceholder: "151 1234567" },
  { code: "TR", dialCode: "+90", name: "Turkey", flag: "🇹🇷", digits: 10, formatPlaceholder: "555 123 4567" },
];

export interface PhoneInputProps {
  label?: string;
  value?: string;
  onChange?: (fullNumber: string, isValid: boolean) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  helperText?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value = "",
  onChange,
  required = false,
  disabled = false,
  className = "",
  error,
  helperText,
}) => {
  // Parse initial value to extract dialCode and national number
  const detectCountry = (val: string): { country: CountryCode; national: string } => {
    const cleaned = (val || "").trim();
    for (const c of COUNTRY_CODES) {
      if (cleaned.startsWith(c.dialCode)) {
        return {
          country: c,
          national: cleaned.slice(c.dialCode.length).replace(/\D/g, ""),
        };
      }
    }
    // Default to Pakistan (+92)
    const pk = COUNTRY_CODES[0];
    const national = cleaned.startsWith("0")
      ? cleaned.slice(1).replace(/\D/g, "")
      : cleaned.replace(/\D/g, "");
    return { country: pk, national };
  };

  const initial = detectCountry(value);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(initial.country);
  const [nationalNumber, setNationalNumber] = useState<string>(initial.national);

  // Sync when prop value changes from outside
  useEffect(() => {
    if (value) {
      const parsed = detectCountry(value);
      setSelectedCountry(parsed.country);
      setNationalNumber(parsed.national);
    }
  }, [value]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = COUNTRY_CODES.find((c) => c.code === e.target.value) || COUNTRY_CODES[0];
    setSelectedCountry(found);
    
    // Trim national number if longer than new country's limit
    const trimmed = nationalNumber.slice(0, found.digits);
    setNationalNumber(trimmed);
    
    const isValid = trimmed.length === found.digits;
    const full = trimmed ? `${found.dialCode}${trimmed}` : "";
    onChange?.(full, isValid);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    // Prevent exceeding the exact expected digit count
    const limited = raw.slice(0, selectedCountry.digits);
    setNationalNumber(limited);

    const isValid = limited.length === selectedCountry.digits;
    const full = limited ? `${selectedCountry.dialCode}${limited}` : "";
    onChange?.(full, isValid);
  };

  const isExactLength = nationalNumber.length === selectedCountry.digits;
  const isTooShort = nationalNumber.length > 0 && nationalNumber.length < selectedCountry.digits;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          <span
            className={`text-[10px] font-mono-data px-1.5 py-0.5 rounded ${
              isExactLength
                ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200"
                : isTooShort
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {nationalNumber.length} / {selectedCountry.digits} digits
          </span>
        </label>
      )}

      <div
        className={`flex items-center rounded-xl border bg-white shadow-2xs transition-all ${
          error || isTooShort
            ? "border-rose-300 ring-2 ring-rose-500/10"
            : isExactLength
            ? "border-emerald-500 ring-2 ring-emerald-500/10"
            : "border-slate-300 focus-within:border-[#0D9488] focus-within:ring-2 focus-within:ring-[#0D9488]/20"
        } ${disabled ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
      >
        {/* Country Code Select Dropdown */}
        <div className="flex items-center border-r border-slate-200 bg-slate-50/80 px-2 py-2 rounded-l-xl">
          <span className="text-base mr-1.5 select-none">{selectedCountry.flag}</span>
          <select
            value={selectedCountry.code}
            onChange={handleCountryChange}
            disabled={disabled}
            className="bg-transparent text-xs font-semibold font-mono-data text-slate-800 focus:outline-none cursor-pointer pr-1"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.dialCode} ({c.name})
              </option>
            ))}
          </select>
        </div>

        {/* National Number Input */}
        <div className="flex-1 flex items-center px-3 py-2">
          <input
            type="tel"
            inputMode="numeric"
            value={nationalNumber}
            onChange={handleNumberChange}
            disabled={disabled}
            placeholder={selectedCountry.formatPlaceholder}
            className="w-full text-xs font-mono-data font-semibold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
          />

          {isExactLength && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1.5" />
          )}
          {isTooShort && (
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 ml-1.5" />
          )}
        </div>
      </div>

      {/* Helper text or validation error */}
      {error ? (
        <p className="text-[11px] text-rose-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      ) : isTooShort ? (
        <p className="text-[11px] text-amber-600">
          Phone number requires {selectedCountry.digits - nationalNumber.length} more digit(s) for {selectedCountry.name} ({selectedCountry.dialCode}).
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
