"use client";

import React from "react";
import { AuditLogsView } from "@/modules/audit/AuditLogsView";

export default function SuperAdminAuditLogsPage() {
  return <AuditLogsView scopedToUser={false} />;
}
