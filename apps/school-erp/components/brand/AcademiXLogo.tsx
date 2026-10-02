import React from "react";
import { cn } from "@/app/lib/utils";

/**
 * AcademiX brand mark — a gradient rounded square with a white graduation cap.
 * Used for the platform brand (auth pages, "made by AcademiX", PDF footers).
 */
export const AcademiXMark: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("shrink-0", className)}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="academix-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0D9488" />
        <stop offset="1" stopColor="#2DD4BF" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="11" fill="url(#academix-grad)" />
    {/* Mortarboard board */}
    <path d="M20 10.5L33 16L20 21.5L7 16L20 10.5Z" fill="white" />
    {/* Cap base */}
    <path
      d="M13 19.2V24c0 1.9 3.1 3.4 7 3.4s7-1.5 7-3.4v-4.8l-7 2.96L13 19.2Z"
      fill="white"
      fillOpacity="0.92"
    />
    {/* Tassel */}
    <path d="M32.5 16.4V22" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="32.5" cy="22.6" r="1.35" fill="white" />
  </svg>
);

/**
 * Full AcademiX lockup: mark + wordmark. `inverted` for dark backgrounds.
 */
export const AcademiXLogo: React.FC<{
  size?: number;
  inverted?: boolean;
  className?: string;
  showMark?: boolean;
}> = ({ size = 32, inverted = false, className, showMark = true }) => (
  <span className={cn("inline-flex items-center gap-2.5", className)}>
    {showMark && <AcademiXMark size={size} />}
    <span
      className={cn(
        "font-bold tracking-tight",
        inverted ? "text-white" : "text-slate-900"
      )}
      style={{ fontSize: size * 0.5 }}
    >
      Academi<span className="text-[#2DD4BF]">X</span>
    </span>
  </span>
);

/** Small "made by AcademiX" attribution line for sidebars / footers. */
export const MadeByAcademiX: React.FC<{ inverted?: boolean; className?: string }> = ({
  inverted = false,
  className,
}) => (
  <div className={cn("flex items-center justify-center gap-1.5", className)}>
    <span
      className={cn(
        "text-[10px]",
        inverted ? "text-slate-500" : "text-slate-400"
      )}
    >
      made by
    </span>
    <AcademiXMark size={14} />
    <span
      className={cn(
        "text-[11px] font-bold tracking-tight",
        inverted ? "text-slate-300" : "text-slate-600"
      )}
    >
      Academi<span className="text-[#0D9488]">X</span>
    </span>
  </div>
);
