import React from "react";
import { cn } from "@/app/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  isMono?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  size = "md",
  dot = false,
  isMono = false,
  children,
  ...props
}) => {
  const variantStyles = {
    primary: "bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const dotColors = {
    primary: "bg-[#0D9488]",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-sky-500",
    neutral: "bg-slate-400",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-0.5 gap-1.5",
    lg: "text-sm px-3 py-1 gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border border-solid transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        isMono && "font-mono-data font-semibold",
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0 animate-pulse",
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
