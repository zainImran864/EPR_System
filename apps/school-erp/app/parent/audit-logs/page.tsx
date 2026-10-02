"use client";

import React from "react";
import { AuditLogsView } from "@/modules/audit/AuditLogsView";

export default function ParentAuditLogsPage() {
  return <AuditLogsView scopedToUser={true} />;
}
