"use client";

import { SchoolSettings } from "@/modules/settings/SchoolSettings";
import { AccountSettings } from "@/modules/settings/AccountSettings";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-10">
      <SchoolSettings />
      <div className="border-t border-slate-200" />
      <AccountSettings />
    </div>
  );
}
