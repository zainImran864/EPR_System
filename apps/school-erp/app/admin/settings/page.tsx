"use client";

import { SchoolSettings } from "@/modules/settings/SchoolSettings";
import { SmtpSettings } from "@/modules/settings/SmtpSettings";
import { WhatsAppIntegrationSettings } from "@/modules/settings/WhatsAppIntegrationSettings";
import { AccountSettings } from "@/modules/settings/AccountSettings";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-10">
      <SchoolSettings />
      <div className="max-w-4xl mx-auto space-y-8">
        <WhatsAppIntegrationSettings />
        <SmtpSettings />
      </div>
      <div className="border-t border-slate-200" />
      <AccountSettings />
    </div>
  );
}
