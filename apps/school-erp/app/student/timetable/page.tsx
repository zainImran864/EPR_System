"use client";

import { MyTimetableView } from "@/modules/timetable/MyTimetableView";

export default function StudentTimetablePage() {
  return (
    <MyTimetableView
      title="My Timetable"
      subtitle="Your weekly class schedule by day and period."
    />
  );
}
