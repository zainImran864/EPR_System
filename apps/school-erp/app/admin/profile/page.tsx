"use client";

import React from "react";
import { UserProfileView } from "@/modules/profile/UserProfileView";

export default function AdminProfilePage() {
  return <UserProfileView roleName="Administrator" roleType="ADMIN" />;
}
