import React from "react";
import { cn } from "@/app/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "highlighted";
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = "default",
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-white border-slate-200/80 shadow-sm",
    subtle: "bg-slate-50 border-slate-200 shadow-none",
    highlighted: "bg-white border-[#0D9488]/30 shadow-md ring-1 ring-[#0D9488]/10",
  };

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-150 overflow-hidden",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn("px-5 py-4 border-b border-slate-100 flex items-center justify-between", className)}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3
    className={cn("text-base font-semibold text-slate-900 tracking-tight", className)}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn("text-xs text-slate-500 mt-0.5", className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn("p-5", className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn("px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between", className)}
    {...props}
  >
    {children}
  </div>
);

// High-impact Metric / KPI Stat Card
export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        "p-5 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200 group",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono-data">
          {value}
        </div>

        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full",
                trend.isPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-slate-500 truncate">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
};
