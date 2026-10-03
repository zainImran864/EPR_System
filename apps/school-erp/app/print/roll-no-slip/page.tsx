"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, ArrowLeft, ShieldCheck, User } from "lucide-react";
import { marksRestApi } from "@/app/api/client";
import { Spinner } from "@/components/ui/Spinner";
import Image from "next/image";

function Toolbar() {
  return (
    <div className="no-print print:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-teal-700 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium">Ready for A4 Official Printing</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-semibold hover:bg-[#0B7A70] transition-colors shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print All Slips / Save as PDF
        </button>
      </div>
    </div>
  );
}

interface SlipData {
  slipType: string;
  isRetake?: boolean;
  examTerm: {
    id: string;
    name: string;
    termType?: string;
    academicYear: string;
  };
  school: {
    name: string;
    code: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
  };
  student: {
    id: string;
    fullName: string;
    admissionNumber: string;
    rollNumber: string;
    photoUrl?: string;
    className: string;
    sectionName: string;
    seatNumber: string;
  };
  dateSheet: Array<{
    subjectName: string;
    code?: string;
    examDate: string;
    dayOfWeek: string;
    timing: string;
    roomNo?: string;
    totalMarks?: number;
  }>;
  instructions: string[];
}

function SingleSlipCard({ slip, isLast }: { slip: SlipData; isLast: boolean }) {
  return (
    <div
      className={`print-sheet max-w-3xl w-full mx-auto my-6 print:my-0 bg-white border-2 border-slate-800 rounded-2xl print:rounded-none p-6 sm:p-8 print:p-0 shadow-sm print:shadow-none print:max-w-none ${
        !isLast ? "page-break" : ""
      }`}
    >
      {/* School Header & Branding */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-slate-800">
        <div className="flex items-center gap-4">
          {slip.school.logoUrl ? (
            <div className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shrink-0">
              <Image
                src={slip.school.logoUrl}
                alt={slip.school.name}
                fill
                className="object-contain p-1"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black text-2xl shrink-0">
              {slip.school.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
              {slip.school.name}
            </h1>
            <p className="text-xs font-semibold text-slate-600">
              {slip.school.address || "Main Academic Campus"} · Tel: {slip.school.phone || "—"}
            </p>
            <div className="inline-block mt-1 px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold tracking-wide uppercase">
              {slip.examTerm.name} ({slip.examTerm.academicYear})
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Admit Card</span>
          <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200 block mt-0.5">
            {slip.isRetake ? "RE-TAKE / SUPPLY" : "OFFICIAL ROLL NO SLIP"}
          </span>
        </div>
      </div>

      {/* Candidate Details & Photo */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 my-5 items-center bg-slate-50/80 p-4 rounded-xl border border-slate-200">
        <div className="sm:col-span-3 grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Candidate Name</span>
            <span className="text-slate-900 font-bold text-sm">{slip.student.fullName}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Roll Number</span>
            <span className="text-slate-900 font-extrabold text-base font-mono-data text-teal-800">
              {slip.student.rollNumber}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Admission Number</span>
            <span className="text-slate-800 font-medium font-mono-data">{slip.student.admissionNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Class & Section</span>
            <span className="text-slate-900 font-bold">
              {slip.student.className} · Section {slip.student.sectionName}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Allocated Seat / Hall</span>
            <span className="text-slate-900 font-semibold">{slip.student.seatNumber}</span>
          </div>
        </div>

        {/* Student Photograph */}
        <div className="flex justify-center sm:justify-end">
          <div className="w-24 h-28 border-2 border-dashed border-slate-300 rounded-lg bg-white overflow-hidden flex flex-col items-center justify-center p-1 text-center shadow-2xs">
            {slip.student.photoUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={slip.student.photoUrl}
                  alt={slip.student.fullName}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-2">
                <User className="w-7 h-7 mb-1" />
                <span className="text-[9px] font-semibold uppercase leading-tight">Affix Photo (Optional)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Examination Date-Sheet Table */}
      <div className="my-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          Examination Schedule & Paper Timetable
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-300">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="p-2.5">Date & Day</th>
                <th className="p-2.5">Subject Paper</th>
                <th className="p-2.5">Timing</th>
                <th className="p-2.5">Room / Hall</th>
                <th className="p-2.5 text-right">Invigilator Sig.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {slip.dateSheet.length > 0 ? (
                slip.dateSheet.map((paper, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-medium text-slate-900">
                      <div>{paper.examDate}</div>
                      <div className="text-[10px] text-slate-500">{paper.dayOfWeek}</div>
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">
                      {paper.subjectName}
                      {paper.code && <span className="text-[10px] text-slate-400 font-normal ml-1">({paper.code})</span>}
                    </td>
                    <td className="p-2.5 font-medium text-slate-700 font-mono-data">{paper.timing}</td>
                    <td className="p-2.5 font-semibold text-slate-800">{paper.roomNo || "Main Hall"}</td>
                    <td className="p-2.5 text-right text-slate-300 font-mono-data">_____________</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    Date sheet will be notified by the examination department.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions & Signatures */}
      <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="sm:col-span-2 text-[10px] text-slate-500 leading-relaxed space-y-1">
          <p className="font-bold text-slate-700 uppercase">Important Guidelines:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {slip.instructions.map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center justify-center pt-6 text-center">
          <div className="w-32 border-b border-slate-900 mb-1" />
          <span className="text-[11px] font-bold text-slate-800">Controller of Examinations</span>
          <span className="text-[9px] text-slate-500">{slip.school.name}</span>
        </div>
      </div>
    </div>
  );
}

function RollNoSlipContent() {
  const params = useSearchParams();
  const examTermId = params.get("examTermId") || "";
  const classId = params.get("classId") || "";
  const sectionId = params.get("sectionId") || "";
  const studentId = params.get("studentId") || "";
  const isRetake = params.get("isRetake") === "true";

  const [slips, setSlips] = useState<SlipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examTermId) {
      setError("Please specify an examination term.");
      setLoading(false);
      return;
    }

    if (studentId) {
      marksRestApi
        .getSingleRollNoSlip(studentId, examTermId, isRetake)
        .then((res) => {
          setSlips([res]);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load candidate roll number slip.");
          setLoading(false);
        });
    } else if (classId) {
      marksRestApi
        .getRollNoSlips(examTermId, classId, sectionId || undefined)
        .then((res) => {
          setSlips(res);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load class roll number slips.");
          setLoading(false);
        });
    } else {
      setError("Please select a class or a specific student.");
      setLoading(false);
    }
  }, [examTermId, classId, sectionId, studentId, isRetake]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-500 font-medium">Generating official examination roll number slips...</p>
      </div>
    );
  }

  if (error || slips.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-base font-bold text-slate-800 mb-1">No Roll Number Slips Generated</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-4">{error || "No active candidates found for this selection."}</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      <Toolbar />
      <div className="print-page-container py-6 px-4 bg-slate-100 min-h-screen print:bg-white print:p-0 print:m-0">
        {slips.map((slip, i) => (
          <SingleSlipCard key={slip.student.id} slip={slip} isLast={i === slips.length - 1} />
        ))}
      </div>
    </div>
  );
}

export default function RollNoSlipPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <RollNoSlipContent />
    </Suspense>
  );
}
