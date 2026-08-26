"use client";

import React, { useState } from "react";
import { useAppStore } from "@/app/store/useAppStore";
import { cn } from "@/app/lib/utils";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export interface ShellProps {
  activeModule: string;
  onSelectModule: (id: string) => void;
  title?: string;
  subtitle?: string;
  onSeedData?: () => void;
  isSeeding?: boolean;
  schoolName?: string;
  schoolCode?: string;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  activeModule,
  onSelectModule,
  title,
  subtitle,
  onSeedData,
  isSeeding,
  schoolName,
  schoolCode,
  children,
}) => {
  const { isSidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={onSelectModule}
        schoolName={schoolName}
        schoolCode={schoolCode}
      />

      {/* Topbar */}
      <Topbar
        title={title}
        subtitle={subtitle}
        onSeedData={onSeedData}
        isSeeding={isSeeding}
      />

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 pt-20 pb-12 px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "md:ml-64" : "md:ml-20"
        )}
      >
        <div className="max-w-7xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
};
