"use client";

import React, { useState } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { ADMIN_NAV } from "@/components/layout/navConfig";
import { useSeed } from "@/app/hooks/useDashboard";
import { useToast } from "@/app/hooks/useToast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const seedSchool = useSeed();
  const { success, error, info } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedSchool({});
      if (result?.alreadySeeded) info("Demo data already present for this tenant.");
      else success("Demo data seeded successfully!");
    } catch (err) {
      console.error("Seed failed", err);
      error("Seeding failed — is the Convex backend deployed?");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <RoleGate allow={["admin"]}>
      <AppShell
        nav={ADMIN_NAV}
        roleLabel="Administrator"
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      >
        {children}
      </AppShell>
    </RoleGate>
  );
}
