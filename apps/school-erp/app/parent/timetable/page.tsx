"use client";

import { MyTimetableView } from "@/modules/timetable/MyTimetableView";

export default function ParentTimetablePage() {
  return (
    <MyTimetableView
      title="Child's Timetable"
      subtitle="Your child's weekly class schedule by day and period."
    />
  );
}
