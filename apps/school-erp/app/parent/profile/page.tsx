"use client";

import React from "react";
import { UserProfileView } from "@/modules/profile/UserProfileView";

export default function ParentProfilePage() {
  return <UserProfileView roleName="Parent & Guardian" roleType="PARENT" />;
}
