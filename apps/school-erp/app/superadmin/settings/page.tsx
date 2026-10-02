"use client";

import React from "react";
import { AccountSettings } from "@/modules/settings/AccountSettings";

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <AccountSettings />
    </div>
  );
}
