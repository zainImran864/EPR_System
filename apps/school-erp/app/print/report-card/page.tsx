"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, ArrowLeft, Award, User, CheckCircle2, AlertCircle } from "lucide-react";
import { marksRestApi } from "@/app/api/client";
import { Spinner } from "@/components/ui/Spinner";
import Image from "next/image";

function Toolbar({ mode, setMode }: { mode: "term" | "full"; setMode: (m: "term" | "full") => void }) {
  return (
    <div className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-teal-700 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setMode("term")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              mode === "term"
                ? "bg-white text-teal-900 font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Term-Wise Report
          </button>
          <button
            onClick={() => setMode("full")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              mode === "full"
                ? "bg-white text-teal-900 font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Full-Year Cumulative
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-semibold hover:bg-[#0B7A70] transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}

function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        .no-print {
          display: none !important;
        }
        body {
          background: white !important;
        }
        .page-break {
          page-break-after: always;
          break-after: page;
        }
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
      }
    `}</style>
  );
}

function SingleReportCardView({ data, isLast }: { data: any; isLast?: boolean }) {
  const isFullYear = data.reportType === "FULL_YEAR_CUMULATIVE";

  return (
    <div
      className={`max-w-3xl mx-auto my-6 bg-white border-2 border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm ${
        !isLast ? "page-break" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-slate-800">
        <div className="flex items-center gap-4">
          {data.school?.logoUrl ? (
            <div className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shrink-0">
              <Image src={data.school.logoUrl} alt={data.school.name} fill className="object-contain p-1" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black text-2xl shrink-0">
              {data.school?.name ? data.school.name.substring(0, 2).toUpperCase() : "AC"}
            </div>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
              {data.school?.name || "School Name"}
            </h1>
            <p className="text-xs font-semibold text-slate-600">
              {data.school?.address || "Main Campus"} · Phone: {data.school?.phone || "—"}
            </p>
            <div className="inline-block mt-1 px-2.5 py-0.5 rounded bg-teal-900 text-white text-[11px] font-bold tracking-wide uppercase">
              {isFullYear
                ? `Annual Cumulative Progress Report (${data.academicYear || "2026-2027"})`
                : `${data.examTerm?.name} (${data.examTerm?.academicYear})`}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Official Transcript</span>
          <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200 block mt-0.5">
            {isFullYear ? "ANNUAL GRADE REPORT" : "TERM REPORT CARD"}
          </span>
        </div>
      </div>

      {/* Student Profile Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 my-5 items-center bg-slate-50/80 p-4 rounded-xl border border-slate-200">
        <div className="sm:col-span-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Student Name</span>
            <span className="text-slate-900 font-bold text-sm">{data.student?.fullName}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Roll Number</span>
            <span className="text-slate-900 font-extrabold text-sm font-mono-data text-teal-800">
              {data.student?.rollNumber || "—"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Admission Number</span>
            <span className="text-slate-800 font-medium font-mono-data">{data.student?.admissionNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Class & Section</span>
            <span className="text-slate-900 font-bold">
              {data.student?.className} ({data.student?.sectionName})
            </span>
          </div>
        </div>

        {/* Student Photo */}
        <div className="flex justify-center sm:justify-end">
          <div className="w-20 h-24 border-2 border-dashed border-slate-300 rounded-lg bg-white overflow-hidden flex flex-col items-center justify-center p-1 text-center shadow-2xs">
            {data.student?.photoUrl ? (
              <div className="relative w-full h-full">
                <Image src={data.student.photoUrl} alt={data.student.fullName} fill className="object-cover rounded" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-1">
                <User className="w-6 h-6 mb-1" />
                <span className="text-[8px] font-semibold uppercase">Photo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Content: Term-Wise or Full Year */}
      {!isFullYear ? (
        /* Term-Wise Subject Table */
        <div className="my-4">
          <table className="w-full text-left border-collapse text-xs border border-slate-300 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="p-2.5">Subject</th>
                <th className="p-2.5 text-center">Max Marks</th>
                <th className="p-2.5 text-center">Obtained</th>
                <th className="p-2.5 text-center">Percentage</th>
                <th className="p-2.5 text-center">Grade</th>
                <th className="p-2.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.subjects?.map((sub: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-bold text-slate-900">
                    {sub.subjectName} {sub.code && <span className="text-[10px] text-slate-400 font-normal">({sub.code})</span>}
                  </td>
                  <td className="p-2.5 text-center font-medium text-slate-600">{sub.totalMarks}</td>
                  <td className="p-2.5 text-center font-bold text-slate-900">{sub.obtainedMarks}</td>
                  <td className="p-2.5 text-center font-semibold text-teal-800">{Math.round(sub.percentage)}%</td>
                  <td className="p-2.5 text-center font-extrabold text-teal-700">{sub.grade}</td>
                  <td className="p-2.5 text-slate-500">{sub.comments || "Good Effort"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#F0FDFA] font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="p-2.5">Cumulative Total</td>
                <td className="p-2.5 text-center">{data.summary?.totalPossible}</td>
                <td className="p-2.5 text-center text-teal-900">{data.summary?.totalObtained}</td>
                <td className="p-2.5 text-center text-teal-800">{data.summary?.overallPercentage}%</td>
                <td className="p-2.5 text-center text-teal-800 text-sm">{data.summary?.overallGrade}</td>
                <td className="p-2.5 text-teal-700 font-semibold">
                  {data.summary?.overallPercentage >= 40 ? "PROMOTED / PASSED" : "NEEDS IMPROVEMENT"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* Full-Year Cumulative Terms Breakdown */
        <div className="my-4 space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-teal-600" />
            Terms Performance Breakdown & Annual Progress
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.terms?.map((term: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800">{term.termName}</div>
                <div className="text-lg font-extrabold text-teal-800 mt-1">
                  {term.percentage}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Score: {term.totalObtained} / {term.totalPossible} (Grade {term.grade})
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-teal-50/80 rounded-xl border border-teal-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-teal-950 block">Grand Annual Percentage</span>
              <span className="text-2xl font-black text-teal-900">{data.summary?.grandPercentage}%</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-teal-950 block">Annual Grade & Status</span>
              <span className="text-sm font-extrabold text-teal-800 px-3 py-1 bg-white rounded-lg border border-teal-300 inline-block mt-0.5">
                Grade {data.summary?.grandGrade} · {data.summary?.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Signatures Row */}
      <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
        <div>
          <div className="w-32 border-b border-slate-800 mx-auto mb-1.5" />
          <span className="font-bold text-slate-800">Class Teacher</span>
        </div>
        <div>
          <div className="w-32 border-b border-slate-800 mx-auto mb-1.5" />
          <span className="font-bold text-slate-800">Controller of Exams</span>
        </div>
        <div>
          <div className="w-32 border-b border-slate-800 mx-auto mb-1.5" />
          <span className="font-bold text-slate-800">Principal Signature</span>
        </div>
      </div>
    </div>
  );
}

function ReportCardContent() {
  const params = useSearchParams();
  const studentId = params.get("student") || params.get("studentId") || "";
  const examId = params.get("exam") || params.get("examTermId") || "";
  const sectionId = params.get("sectionId") || "";
  const isBatch = params.get("mode") === "batch";

  const [mode, setMode] = useState<"term" | "full">(examId ? "term" : "full");
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId && !isBatch) {
      setError("No candidate or section selected.");
      setLoading(false);
      return;
    }

    setLoading(true);
    if (isBatch && examId && sectionId) {
      marksRestApi
        .getBatchReportCards(examId, sectionId)
        .then((res) => {
          setDataList(res);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load batch report cards.");
          setLoading(false);
        });
    } else if (studentId) {
      const selectedExam = mode === "term" ? examId || undefined : undefined;
      marksRestApi
        .getStudentReportCard(studentId, selectedExam)
        .then((res) => {
          setDataList([res]);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load report card.");
          setLoading(false);
        });
    }
  }, [studentId, examId, sectionId, isBatch, mode]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-500 font-medium">Generating official academic transcripts...</p>
      </div>
    );
  }

  if (error || dataList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-base font-bold text-slate-800 mb-1">Report Card Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-4">{error || "No examination marks found for this student."}</p>
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
      <Toolbar mode={mode} setMode={setMode} />
      <PrintStyles />
      <div className="py-6 px-4 bg-slate-100 min-h-screen">
        {dataList.map((card, i) => (
          <SingleReportCardView key={card.student?.id || i} data={card} isLast={i === dataList.length - 1} />
        ))}
      </div>
    </div>
  );
}

export default function ReportCardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <ReportCardContent />
    </Suspense>
  );
}
