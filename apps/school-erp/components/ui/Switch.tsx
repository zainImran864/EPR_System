"use client";

import React from "react";
import { cn } from "@/app/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  id?: string;
  className?: string;
}

/**
 * Reusable accessible toggle switch. Controlled via `checked` + `onCheckedChange`.
 */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  size = "md",
  id,
  className,
}) => {
  const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  const dims = {
    sm: { track: "w-8 h-4.5", knob: "w-3.5 h-3.5", travel: "translate-x-3.5" },
    md: { track: "w-10 h-5.5", knob: "w-4.5 h-4.5", travel: "translate-x-[18px]" },
  }[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:ring-offset-1",
          dims.track,
          checked ? "bg-[#0D9488]" : "bg-slate-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "inline-block rounded-full bg-white shadow-sm transition-transform duration-200",
            dims.knob,
            checked ? dims.travel : "translate-x-0"
          )}
        />
      </button>

      {(label || description) && (
        <label
          htmlFor={switchId}
          className={cn(
            "flex flex-col select-none",
            !disabled && "cursor-pointer"
          )}
          onClick={() => !disabled && onCheckedChange(!checked)}
        >
          {label && (
            <span className="text-sm font-medium text-slate-800 leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-slate-500 mt-0.5">{description}</span>
          )}
        </label>
      )}
    </div>
  );
};
