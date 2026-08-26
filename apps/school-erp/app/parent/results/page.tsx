"use client";

import { Award } from "lucide-react";
import { PortalPlaceholder } from "@/components/layout/PortalPlaceholder";

export default function ParentResultsPage() {
  return (
    <PortalPlaceholder
      icon={Award}
      title="Child's Results"
      description="Your child's subject-wise marks and grades for each exam, with an overall result."
      points={[
        "Per-subject marks, totals and grades",
        "Overall percentage and grade per exam term",
        "Downloadable report card (school logo top, AcademiX bottom)",
      ]}
    />
  );
}
