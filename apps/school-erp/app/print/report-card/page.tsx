"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PrintDocument } from "@/components/print/PrintDocument";
import { useReportCard } from "@/app/hooks/useResults";
import { Spinner } from "@/components/ui/Spinner";

function ReportCardInner() {
  const params = useSearchParams();
  const studentId = params.get("student");
  const examId = params.get("exam");
  const { report, isLoading } = useReportCard(studentId, examId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Report card not found.
      </div>
    );
  }

  return (
    <PrintDocument
      schoolName={report.school?.name}
      schoolLogoUrl={report.school?.logoUrl}
      schoolAddress={report.school?.address}
      docTitle="Report Card"
      docSubtitle={report.exam ? `${report.exam.name} · ${report.exam.term}` : ""}
    >
      {/* Student info */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-6">
        <Info label="Student Name" value={report.student.name} />
        <Info label="Admission No" value={report.student.admissionNumber} />
        <Info label="Class" value={`${report.student.className} · ${report.student.sectionName}`} />
        <Info label="Roll No" value={report.student.rollNumber} />
      </div>

      {/* Marks table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="text-left p-2.5 border border-slate-200 font-semibold">Subject</th>
            <th className="text-center p-2.5 border border-slate-200 font-semibold w-24">Total</th>
            <th className="text-center p-2.5 border border-slate-200 font-semibold w-24">Obtained</th>
            <th className="text-center p-2.5 border border-slate-200 font-semibold w-20">Grade</th>
          </tr>
        </thead>
        <tbody>
          {report.subjects.map((s, i) => (
            <tr key={i}>
              <td className="p-2.5 border border-slate-200">{s.subjectName}</td>
              <td className="p-2.5 border border-slate-200 text-center">{s.totalMarks}</td>
              <td className="p-2.5 border border-slate-200 text-center font-medium">
                {s.obtainedMarks}
              </td>
              <td className="p-2.5 border border-slate-200 text-center font-semibold text-[#0D9488]">
                {s.grade}
              </td>
            </tr>
          ))}
          {report.subjects.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-slate-400 border border-slate-200">
                No marks recorded for this exam.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-[#F0FDFA] font-bold">
            <td className="p-2.5 border border-slate-200">Total</td>
            <td className="p-2.5 border border-slate-200 text-center">{report.totalMarks}</td>
            <td className="p-2.5 border border-slate-200 text-center">{report.obtainedMarks}</td>
            <td className="p-2.5 border border-slate-200 text-center text-[#0D9488]">
              {report.overallGrade}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Summary */}
      <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-4">
        <Summary label="Percentage" value={`${report.percentage}%`} />
        <Summary label="Overall Grade" value={report.overallGrade} />
        <Summary
          label="Result"
          value={report.percentage >= 40 ? "PASS" : "FAIL"}
          highlight={report.percentage >= 40 ? "pass" : "fail"}
        />
      </div>

      {/* Signatures */}
      <div className="mt-16 flex items-end justify-between text-xs text-slate-500">
        <SignLine label="Class Teacher" />
        <SignLine label="Principal" />
        <SignLine label="Parent / Guardian" />
      </div>
    </PrintDocument>
  );
}

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-slate-400 w-28 shrink-0">{label}:</span>
    <span className="font-medium text-slate-800">{value}</span>
  </div>
);

const Summary: React.FC<{ label: string; value: string; highlight?: "pass" | "fail" }> = ({
  label,
  value,
  highlight,
}) => (
  <div className="text-center">
    <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    <div
      className={`text-lg font-bold ${
        highlight === "pass"
          ? "text-emerald-600"
          : highlight === "fail"
          ? "text-rose-600"
          : "text-slate-900"
      }`}
    >
      {value}
    </div>
  </div>
);

const SignLine: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-center">
    <div className="w-32 border-t border-slate-400 mb-1" />
    {label}
  </div>
);

export default function ReportCardPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <ReportCardInner />
    </Suspense>
  );
}
