"use client";

import React, { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/app/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      options = [],
      placeholder,
      disabled,
      id,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-slate-700 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full appearance-none rounded-lg border bg-white pl-3.5 pr-10 py-2 text-sm text-slate-900 transition-all duration-150 cursor-pointer",
              "border-slate-300 hover:border-slate-400 focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20",
              "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
              error && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled selected>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 w-4 h-4 text-slate-400" />
        </div>
        {error ? (
          <span className="text-xs font-medium text-red-600">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-slate-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
