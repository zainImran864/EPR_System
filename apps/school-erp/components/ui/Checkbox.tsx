"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/app/lib/utils";
import { Check, Minus } from "lucide-react";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  size?: "sm" | "md";
  id?: string;
  className?: string;
}

/**
 * Reusable accessible checkbox with indeterminate + label support.
 * Controlled via `checked` + `onCheckedChange`.
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  indeterminate = false,
  size = "md",
  id,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const boxId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate && !checked;
    }
  }, [indeterminate, checked]);

  const boxSize = size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const isMarked = checked || indeterminate;

  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          ref={inputRef}
          id={boxId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          onClick={() => !disabled && onCheckedChange(!checked)}
          className={cn(
            "flex items-center justify-center rounded-[5px] border transition-all duration-150",
            boxSize,
            isMarked
              ? "bg-[#0D9488] border-[#0D9488] text-white"
              : "bg-white border-slate-300 hover:border-slate-400",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-[#0D9488]/30 peer-focus-visible:ring-offset-1",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          )}
        >
          {indeterminate && !checked ? (
            <Minus className={cn(iconSize, "stroke-[3]")} />
          ) : checked ? (
            <Check className={cn(iconSize, "stroke-[3]")} />
          ) : null}
        </span>
      </span>

      {(label || description) && (
        <label
          htmlFor={boxId}
          className={cn(
            "flex flex-col select-none -mt-0.5",
            !disabled && "cursor-pointer"
          )}
        >
          {label && (
            <span className="text-sm font-medium text-slate-800 leading-snug">
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
