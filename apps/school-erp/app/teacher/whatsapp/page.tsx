"use client";

import React from "react";
import { WhatsAppCenter } from "@/modules/notifications/WhatsAppCenter";

export default function TeacherWhatsAppPage() {
  return <WhatsAppCenter isTeacher={true} />;
}
