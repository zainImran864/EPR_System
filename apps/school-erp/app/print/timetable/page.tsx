"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, ArrowLeft, CalendarDays, Clock, MapPin, Users, BookOpen } from "lucide-react";
import { timetableRestApi, authRestApi, classesRestApi, teachersRestApi } from "@/app/api/client";
import { Spinner } from "@/components/ui/Spinner";
import Image from "next/image";

const DAYS = [
  { value: 0, label: "Monday", short: "Mon" },
  { value: 1, label: "Tuesday", short: "Tue" },
  { value: 2, label: "Wednesday", short: "Wed" },
  { value: 3, label: "Thursday", short: "Thu" },
  { value: 4, label: "Friday", short: "Fri" },
  { value: 5, label: "Saturday", short: "Sat" },
];

const DAY_ENUM_TO_NUM: Record<string, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

function Toolbar({ title }: { title: string }) {
  return (
    <div className="no-print print:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
      <button
        onClick={() => {
          if (window.opener) {
            window.close();
            return;
          }
          if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
            window.history.back();
          } else {
            window.close();
            setTimeout(() => {
              if (document.referrer && document.referrer.includes(window.location.host)) {
                window.location.href = document.referrer;
              } else {
                window.location.href = "/admin/timetable";
              }
            }, 150);
          }
        }}
        className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-teal-700 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          {title} · Ready for A4 Print
        </span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-semibold hover:bg-[#0B7A70] transition-colors shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print Timetable / Save as PDF
        </button>
      </div>
    </div>
  );
}

function TimetablePrintContent() {
  const searchParams = useSearchParams();
  const sectionId = searchParams.get("sectionId");
  const classId = searchParams.get("classId");
  const teacherId = searchParams.get("teacherId");
  const isTeacherView = Boolean(teacherId);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [slots, setSlots] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [metaInfo, setMetaInfo] = useState<{
    title: string;
    subtitle: string;
    details: Array<{ label: string; value: string }>;
  }>({
    title: "Official Academic Timetable",
    subtitle: "Weekly Lecture Schedule",
    details: [],
  });

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setErrorMsg("");

      try {
        // Fetch current user and school profile
        const userRes = await authRestApi.me().catch(() => null);
        const schoolObj = userRes?.user?.school || {
          name: "School ERP System",
          code: "SCH-001",
          activeYear: "2026-2027",
        };
        if (mounted) setSchool(schoolObj);

        let rawSlots: any[] = [];

        if (teacherId) {
          // Fetch teacher timetable & teacher details
          const [teacherSlots, teachersList] = await Promise.all([
            timetableRestApi.getTeacherTimetable(teacherId).catch(() => []),
            teachersRestApi.getAll().catch(() => []),
          ]);

          rawSlots = Array.isArray(teacherSlots) ? teacherSlots : [];
          const teacherObj = (teachersList || []).find(
            (t: any) => t._id === teacherId || t.id === teacherId
          );

          const teacherName =
            teacherObj
              ? `${teacherObj.firstName || ""} ${teacherObj.lastName || ""}`.trim() || teacherObj.fullName
              : rawSlots[0]?.teacher?.fullName || "Faculty Member";

          if (mounted) {
            setMetaInfo({
              title: `Teacher Timetable — ${teacherName}`,
              subtitle: "Faculty Weekly Schedule Across Assigned Classes & Sections",
              details: [
                { label: "Faculty Name", value: teacherName },
                { label: "Designation", value: teacherObj?.designation || "Senior Teacher" },
                { label: "Department / Subject", value: teacherObj?.department || teacherObj?.specialization || "Academics" },
                { label: "Total Assigned Periods", value: `${rawSlots.length} Periods/Week` },
                { label: "Academic Session", value: schoolObj.activeYear || "2026-2027" },
              ],
            });
          }
        } else if (sectionId) {
          // Fetch section timetable
          const [secSlots, classesList] = await Promise.all([
            timetableRestApi.getSectionTimetable(sectionId).catch(() => []),
            classesRestApi.getAll().catch(() => []),
          ]);

          rawSlots = Array.isArray(secSlots) ? secSlots : [];

          let clsName = rawSlots[0]?.section?.class?.name || "Class";
          let secName = rawSlots[0]?.section?.name || "Section";

          // Try finding section details in classes list
          if (Array.isArray(classesList)) {
            for (const c of classesList) {
              const sec = (c.sections || []).find((s: any) => (s._id || s.id) === sectionId);
              if (sec) {
                clsName = c.name;
                secName = sec.name;
                break;
              }
            }
          }

          if (mounted) {
            setMetaInfo({
              title: `Class Timetable — ${clsName} (${secName})`,
              subtitle: "Weekly Lecture Schedule & Room Allocations",
              details: [
                { label: "Class", value: clsName },
                { label: "Section", value: secName },
                { label: "Total Periods", value: `${rawSlots.length} Periods/Week` },
                { label: "Academic Session", value: schoolObj.activeYear || "2026-2027" },
                { label: "Effective From", value: "Term Start" },
              ],
            });
          }
        } else if (classId) {
          // Fetch full class timetable
          const [clsSlots, classesList] = await Promise.all([
            timetableRestApi.getClassTimetable(classId).catch(() => []),
            classesRestApi.getAll().catch(() => []),
          ]);

          rawSlots = Array.isArray(clsSlots) ? clsSlots : [];
          const cls = (classesList || []).find((c: any) => (c._id || c.id) === classId);
          const clsName = cls?.name || rawSlots[0]?.section?.class?.name || "Class";

          if (mounted) {
            setMetaInfo({
              title: `Master Class Timetable — ${clsName}`,
              subtitle: "Comprehensive Weekly Schedule for all Sections",
              details: [
                { label: "Class", value: clsName },
                { label: "Total Sessions", value: `${rawSlots.length} Lectures Scheduled` },
                { label: "Academic Session", value: schoolObj.activeYear || "2026-2027" },
              ],
            });
          }
        } else {
          setErrorMsg("Please provide a valid sectionId, classId, or teacherId query parameter.");
          setLoading(false);
          return;
        }

        // Map slots
        const mapped = rawSlots.map((s: any) => {
          const dayNum =
            typeof s.dayOfWeek === "number"
              ? s.dayOfWeek
              : (DAY_ENUM_TO_NUM[String(s.dayOfWeek).toUpperCase()] ?? 0);

          return {
            _id: s.id || s._id,
            dayOfWeek: dayNum,
            period: s.periodNumber || s.period || 1,
            startTime: s.startTime || "08:00",
            endTime: s.endTime || "08:45",
            subjectName: s.subject?.name || s.subjectName || "Subject",
            teacherName: s.teacher?.fullName || s.teacherName || "",
            className: s.section?.class?.name || s.class?.name || s.className || "",
            sectionName: s.section?.name || s.sectionName || "",
            room: s.room || null,
          };
        });

        if (mounted) {
          setSlots(mapped);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMsg(err.message || "Failed to load timetable details.");
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [sectionId, classId, teacherId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-500 font-medium">Preparing printable timetable...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-red-200 text-center space-y-3">
          <p className="text-sm font-semibold text-red-600">{errorMsg}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const periods = Array.from(new Set(slots.map((s) => s.period))).sort((a, b) => a - b);
  // Default to 8 periods if none scheduled yet
  const displayPeriods = periods.length > 0 ? periods : [1, 2, 3, 4, 5, 6, 7, 8];

  const getCellSlots = (day: number, period: number) =>
    slots.filter((s) => s.dayOfWeek === day && s.period === period);

  useEffect(() => {
    if (school?.name) {
      document.title = `${school.name} — ${metaInfo.title}`;
    } else {
      document.title = metaInfo.title || "Official Academic Timetable";
    }
  }, [school, metaInfo.title]);

  return (
    <div className="min-h-screen print:min-h-0 bg-slate-100 print:bg-white text-slate-900">
      <Toolbar title={metaInfo.title} />

      <div className="max-w-6xl mx-auto p-4 sm:p-8 print:p-[6mm] my-6 print:my-0">
        <div className="timetable-print-card bg-white border-2 border-slate-800 rounded-2xl print:rounded-lg p-6 sm:p-8 print:p-3 shadow-sm print:shadow-none">
          {/* Header & School Branding */}
          <div className="flex items-center justify-between pb-4 print:pb-2 border-b-2 border-slate-800 gap-4">
            <div className="flex items-center gap-4 print:gap-2.5">
              {school?.logoUrl ? (
                <div className="relative w-16 h-16 print:w-11 print:h-11 rounded-xl border border-slate-200 overflow-hidden shrink-0">
                  <Image
                    src={school.logoUrl}
                    alt={school.name || "School"}
                    fill
                    className="object-contain p-1"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 print:w-11 print:h-11 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black text-2xl print:text-lg shrink-0">
                  {(school?.name || "ERP").substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl print:text-lg font-black text-slate-950 uppercase tracking-tight leading-tight">
                  {school?.name || "Official School System"}
                </h1>
                <p className="text-xs print:text-[10px] font-medium text-slate-600">
                  {school?.address || "Main Academic Campus"} · Phone: {school?.phone || "Office"}
                </p>
                <div className="inline-block mt-1 print:mt-0.5 px-2.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[11px] print:text-[10px] font-bold uppercase tracking-wider">
                  {metaInfo.title}
                </div>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Academic Year
              </span>
              <span className="text-sm print:text-xs font-black text-slate-900">
                {school?.activeYear || "2026-2027"}
              </span>
              <span className="text-[11px] print:text-[10px] text-slate-500 block mt-0.5">
                Printed: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="my-4 print:my-1.5 p-3 print:p-1.5 bg-slate-50 border border-slate-200 rounded-xl print:rounded-md grid grid-cols-2 sm:grid-cols-5 gap-3 print:gap-2 text-xs print:text-[10px]">
            {metaInfo.details.map((d, i) => (
              <div key={i} className="space-y-0.5 print:space-y-0">
                <span className="text-[10px] print:text-[9px] font-bold uppercase text-slate-500 tracking-wider">
                  {d.label}
                </span>
                <p className="font-semibold text-slate-900 truncate">{d.value}</p>
              </div>
            ))}
          </div>

          {/* Timetable Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg print:rounded-md">
            <table className="w-full border-collapse text-xs print:text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 border-b border-slate-800">
                  <th className="p-2.5 print:py-1 print:px-1.5 text-left font-black border-r border-slate-800 w-24 print:w-20">
                    Day / Time
                  </th>
                  {displayPeriods.map((p) => {
                    const anchor = slots.find((s) => s.period === p);
                    return (
                      <th
                        key={p}
                        className="p-2 print:py-1 print:px-1 text-center font-bold border-r last:border-r-0 border-slate-800 min-w-[110px] print:min-w-0"
                      >
                        <div className="font-black text-slate-950">Period {p}</div>
                        {anchor ? (
                          <div className="text-[10px] print:text-[9px] font-normal text-slate-600 font-mono mt-0.5 print:mt-0">
                            {anchor.startTime}–{anchor.endTime}
                          </div>
                        ) : (
                          <div className="text-[10px] print:text-[9px] font-normal text-slate-400 font-mono mt-0.5 print:mt-0">
                            P{p}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day.value} className="border-b last:border-b-0 border-slate-300">
                    <td className="p-2.5 print:py-1 print:px-1.5 font-black text-slate-900 bg-slate-50 border-r border-slate-800">
                      <div>{day.label}</div>
                      <div className="text-[10px] print:text-[9px] text-slate-500 font-medium">{day.short}</div>
                    </td>
                    {displayPeriods.map((p) => {
                      const cellSlots = getCellSlots(day.value, p);
                      return (
                        <td
                          key={p}
                          className="p-1.5 print:p-1 border-r last:border-r-0 border-slate-300 align-top text-center"
                        >
                          {cellSlots.length > 0 ? (
                            <div className="space-y-1 print:space-y-0.5">
                              {cellSlots.map((c, idx) => (
                                <div
                                  key={c._id || idx}
                                  className="p-1.5 print:p-1 rounded bg-teal-50/70 border border-teal-300/80 text-left"
                                >
                                  <div className="font-bold text-teal-950 text-xs print:text-[10px] truncate leading-tight">
                                    {c.subjectName}
                                  </div>

                                  {/* For teacher view: SHOW THE CLASS & SECTION! */}
                                  {isTeacherView && (c.className || c.sectionName) && (
                                    <div className="text-[10px] print:text-[9px] font-semibold text-teal-800 mt-0.5 print:mt-0 flex items-center gap-1 leading-tight">
                                      <Users className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                                      <span>
                                        {c.className} {c.sectionName ? `(${c.sectionName})` : ""}
                                      </span>
                                    </div>
                                  )}

                                  {/* For class view: SHOW TEACHER NAME */}
                                  {!isTeacherView && c.teacherName && (
                                    <div className="text-[10px] print:text-[9px] font-medium text-slate-700 mt-0.5 print:mt-0 flex items-center gap-1 leading-tight">
                                      <Users className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                      <span className="truncate">{c.teacherName}</span>
                                    </div>
                                  )}

                                  {c.room && (
                                    <div className="text-[9px] print:text-[8px] font-semibold text-slate-500 mt-0.5 print:mt-0 flex items-center gap-1 leading-tight">
                                      <MapPin className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                                      <span>{c.room}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-10 print:h-5 flex items-center justify-center text-slate-300 text-xs print:text-[10px]">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes & Instructions */}
          <div className="mt-4 print:mt-1.5 p-3 print:p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] print:text-[9px] text-slate-600">
            <span className="font-bold text-slate-800">Note: </span>
            <span>
              All students and faculty members are required to adhere to scheduled timings strictly.
              Any room changes or substitute lectures must be coordinated through the Academic Administration Office.
            </span>
          </div>

          {/* Signatures & Verification Block — kept strictly on the same page */}
          <div className="mt-8 print:mt-2.5 pt-5 print:pt-2 border-t border-slate-300 grid grid-cols-3 gap-6 print:gap-4 text-center text-xs print:text-[10px] avoid-break">
            <div>
              <div className="h-9 print:h-5 border-b border-dashed border-slate-400 mx-auto w-3/4"></div>
              <p className="mt-1.5 print:mt-1 font-bold text-slate-800">Timetable Coordinator</p>
              <p className="text-[10px] print:text-[9px] text-slate-500">Prepared &amp; Verified</p>
            </div>
            <div>
              <div className="h-9 print:h-5 border-b border-dashed border-slate-400 mx-auto w-3/4"></div>
              <p className="mt-1.5 print:mt-1 font-bold text-slate-800">Head of Department</p>
              <p className="text-[10px] print:text-[9px] text-slate-500">Academic Review</p>
            </div>
            <div>
              <div className="h-9 print:h-5 border-b border-dashed border-slate-400 mx-auto w-3/4"></div>
              <p className="mt-1.5 print:mt-1 font-bold text-slate-800">Principal / Director</p>
              <p className="text-[10px] print:text-[9px] text-slate-500">Official Seal &amp; Approval</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0mm !important;
          }
          html,
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .timetable-print-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            max-height: 198mm !important;
            overflow: hidden !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function TimetablePrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Spinner size="lg" />
        </div>
      }
    >
      <TimetablePrintContent />
    </Suspense>
  );
}
