"use client";

import { MyResultsView } from "@/modules/results/MyResultsView";

export default function StudentResultsPage() {
  return (
    <MyResultsView
      title="My Results"
      subtitle="Your subject-wise marks, grades and overall performance per exam."
    />
  );
}
