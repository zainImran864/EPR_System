"use client";

import React from "react";
import { AccountSettings } from "@/modules/settings/AccountSettings";
import { WhatsAppIntegrationSettings } from "@/modules/settings/WhatsAppIntegrationSettings";
import { KycVerificationCard } from "@/modules/settings/KycVerificationCard";

export default function TeacherSettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <WhatsAppIntegrationSettings />
      <KycVerificationCard userRole="TEACHER" />
      <div className="border-t border-slate-200" />
      <AccountSettings />
    </div>
  );
}
