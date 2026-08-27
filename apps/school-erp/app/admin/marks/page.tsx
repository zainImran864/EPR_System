"use client";

import { AdminResults } from "@/modules/results/AdminResults";

export default function AdminMarksPage() {
  // Admins can review all results & report cards, but do not enter marks —
  // only the subject's assigned teacher can upload marks.
  return <AdminResults />;
}
