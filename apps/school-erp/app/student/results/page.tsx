"use client";

import { Award } from "lucide-react";
import { PortalPlaceholder } from "@/components/layout/PortalPlaceholder";

export default function StudentResultsPage() {
  return (
    <PortalPlaceholder
      icon={Award}
      title="My Results"
      description="Your subject-wise marks and grades for each exam, aggregated into an overall result."
      points={[
        "Per-subject marks, totals and auto-computed grades",
        "Overall percentage and grade per exam term",
        "Downloadable report card (school logo top, AcademiX bottom)",
      ]}
    />
  );
}
