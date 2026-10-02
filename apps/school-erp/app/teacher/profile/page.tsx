"use client";

import React from "react";
import { UserProfileView } from "@/modules/profile/UserProfileView";

export default function TeacherProfilePage() {
  return <UserProfileView roleName="Faculty Teacher" roleType="TEACHER" />;
}
