"use client";

import { MarkEntryGrid } from "@/modules/marks/MarkEntryGrid";
import { AdminResults } from "@/modules/results/AdminResults";

export default function AdminMarksPage() {
  return (
    <div className="space-y-10">
      <MarkEntryGrid />
      <div className="border-t border-slate-200" />
      <AdminResults />
    </div>
  );
}
