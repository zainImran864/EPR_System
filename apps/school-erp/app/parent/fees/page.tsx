"use client";

import { Wallet } from "lucide-react";
import { PortalPlaceholder } from "@/components/layout/PortalPlaceholder";

export default function ParentFeesPage() {
  return (
    <PortalPlaceholder
      icon={Wallet}
      title="Fees"
      description="Your child's fee status, installment schedule, due dates and downloadable challans."
      points={[
        "Per-head breakdown (tuition, paper, etc.) and totals",
        "Paid / due status with installment history",
        "Download fee challan PDF (school logo top, AcademiX bottom)",
      ]}
    />
  );
}
