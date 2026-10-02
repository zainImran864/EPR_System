"use client";

import React from "react";
import { AccountSettings } from "@/modules/settings/AccountSettings";
import { KycVerificationCard } from "@/modules/settings/KycVerificationCard";

export default function ParentSettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <KycVerificationCard userRole="PARENT" />
      <div className="border-t border-slate-200" />
      <AccountSettings />
    </div>
  );
}
