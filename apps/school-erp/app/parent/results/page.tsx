"use client";

import { MyResultsView } from "@/modules/results/MyResultsView";

export default function ParentResultsPage() {
  return (
    <MyResultsView
      title="Child's Results"
      subtitle="Your child's subject-wise marks, grades and overall result per exam."
    />
  );
}
