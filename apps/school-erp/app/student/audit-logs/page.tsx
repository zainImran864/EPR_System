"use client";

import React from "react";
import { AuditLogsView } from "@/modules/audit/AuditLogsView";

export default function StudentAuditLogsPage() {
  return <AuditLogsView scopedToUser={true} />;
}
