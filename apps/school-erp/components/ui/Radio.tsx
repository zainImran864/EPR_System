"use client";

import React from "react";
import { cn } from "@/app/lib/utils";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  orientation?: "vertical" | "horizontal";
  size?: "sm" | "md";
  className?: string;
}

/**
 * Reusable radio group. Controlled via `value` + `onChange`.
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  orientation = "vertical",
  size = "md",
  className,
}) => {
  const dot = size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]";
  const inner = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <div
      role="radiogroup"
      className={cn(
        "flex gap-3",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap items-center",
        className
      )}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        const inputId = `${name}-${opt.value}`;
        return (
          <label
            key={opt.value}
            htmlFor={inputId}
            className={cn(
              "flex items-start gap-2.5",
              opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            <input
              id={inputId}
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              disabled={opt.disabled}
              onChange={() => onChange(opt.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex items-center justify-center rounded-full border transition-all duration-150 mt-0.5 shrink-0",
                dot,
                selected ? "border-[#0D9488]" : "border-slate-300 hover:border-slate-400",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-[#0D9488]/30 peer-focus-visible:ring-offset-1"
              )}
            >
              {selected && (
                <span className={cn("rounded-full bg-[#0D9488]", inner)} />
              )}
            </span>
            <span className="flex flex-col select-none">
              <span className="text-sm font-medium text-slate-800 leading-snug">
                {opt.label}
              </span>
              {opt.description && (
                <span className="text-xs text-slate-500 mt-0.5">
                  {opt.description}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
};
