"use client";

import React from "react";
import { cn } from "@/app/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "underline" | "pills";
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  className,
}) => {
  if (variant === "pills") {
    return (
      <div
        className={cn(
          "inline-flex items-center p-1 bg-slate-100/90 rounded-xl gap-1 border border-slate-200/60",
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all select-none",
                isActive
                  ? "bg-white text-[#0D9488] shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono-data",
                    isActive
                      ? "bg-[#CCFBF1] text-[#0F766E]"
                      : "bg-slate-200 text-slate-600"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant (Default)
  return (
    <div className={cn("border-b border-slate-200 flex gap-6", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all select-none -mb-px",
              isActive
                ? "border-[#0D9488] text-[#0D9488] font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-mono-data",
                  isActive
                    ? "bg-[#CCFBF1] text-[#0F766E]"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
