"use client";

import { MyFeesView } from "@/modules/fees/MyFeesView";

export default function ParentFeesPage() {
  return (
    <MyFeesView
      title="Fees"
      subtitle="Your child's fee bills, balances and downloadable challans."
    />
  );
}
