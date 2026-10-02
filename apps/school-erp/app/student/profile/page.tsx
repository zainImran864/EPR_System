"use client";

import React from "react";
import { UserProfileView } from "@/modules/profile/UserProfileView";

export default function StudentProfilePage() {
  return <UserProfileView roleName="Student" roleType="STUDENT" />;
}
