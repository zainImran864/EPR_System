"use client";

import React from "react";
import { UserProfileView } from "@/modules/profile/UserProfileView";

export default function SuperAdminProfilePage() {
  return <UserProfileView roleName="System SuperAdmin" roleType="SUPERADMIN" />;
}
