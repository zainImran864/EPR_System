import React from "react";
import { cn } from "@/app/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rounded",
  ...props
}) => {
  const variantStyles = {
    text: "h-3.5 w-full rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-xl",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200/80",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
};

// Dashboard Shimmer Skeleton matching the exact real layout
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Banner Skeleton */}
      <div className="rounded-2xl bg-slate-200/90 p-8 space-y-4 animate-pulse">
        <Skeleton className="h-5 w-36 bg-slate-300 rounded-full" />
        <Skeleton className="h-8 w-72 bg-slate-300" />
        <Skeleton className="h-4 w-96 bg-slate-300/80" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-9 w-36 bg-slate-300" />
          <Skeleton className="h-9 w-36 bg-slate-300" />
        </div>
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 bg-white rounded-xl border border-slate-200 space-y-3"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-slate-200 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="flex items-center gap-4 py-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
};

// Table Shimmer Skeleton
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 6,
}) => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden space-y-3 p-4">
      <div className="flex justify-between items-center pb-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="py-3.5 flex items-center gap-4">
            <Skeleton className="h-6 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
