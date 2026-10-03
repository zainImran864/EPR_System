"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, ArrowLeft, BookOpen, Clock, Award, User, AlertCircle, FileText } from "lucide-react";
import { marksRestApi } from "@/app/api/client";

function QuestionPaperContent() {
  const searchParams = useSearchParams();
  const paperId = searchParams.get("paperId");

  const [paper, setPaper] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paperId) {
      setError("No Question Paper ID specified.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const data = await marksRestApi.getPrintableQuestionPaper(paperId);
        setPaper(data);
      } catch (err: any) {
        setError(err.message || "Failed to load printable question paper.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [paperId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600 text-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span>Generating Official Question Paper Layout...</span>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-rose-200 text-center shadow-lg">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-900">Error Loading Paper</h2>
          <p className="text-xs text-slate-500 mt-1">{error || "Paper not found."}</p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const { school, examination, instructions, sections } = paper;

  return (
    <div className="print-page-container min-h-screen bg-slate-200/70 p-4 sm:p-8 font-sans print:p-0 print:bg-white text-slate-900">
      {/* Floating Print Bar - Hidden during printing */}
      <div className="no-print print:hidden max-w-4xl mx-auto mb-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-md border border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span>&middot;</span>
          <span className="font-semibold text-slate-800">
            {examination.subjectName} — {examination.className} (Version {paper.version})
          </span>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0f766e] text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print Examination Paper
        </button>
      </div>

      {/* Printable Sheet (Standard A4) */}
      <div className="print-sheet max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-2xl rounded-2xl border border-slate-300/80 print:shadow-none print:border-0 print:p-0 print:max-w-none print:rounded-none">
        {/* Top Header */}
        <div className="text-center pb-4 border-b-2 border-slate-900">
          {school.logoUrl && (
            <img
              src={school.logoUrl}
              alt={school.name}
              className="w-14 h-14 object-contain mx-auto mb-2"
            />
          )}
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            {school.name}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">{school.address || "Main Academic Campus"}</p>
          <div className="inline-block mt-2 px-4 py-1 rounded-md bg-slate-100 border border-slate-300 text-xs font-bold tracking-wide uppercase text-slate-800">
            {examination.examTermName} &middot; {examination.academicYear}
          </div>
        </div>

        {/* Paper Metadata Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 my-4 bg-slate-50 border border-slate-300 rounded-lg text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Subject</span>
            <span className="font-bold text-slate-900">{examination.subjectName}</span>
            {examination.subjectCode && (
              <span className="text-[10px] text-slate-500 ml-1 font-mono">({examination.subjectCode})</span>
            )}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Class / Grade</span>
            <span className="font-bold text-slate-900">{examination.className}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Time Allowed</span>
            <span className="font-bold text-slate-900">{examination.duration}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Maximum Marks</span>
            <span className="font-bold text-teal-700">{examination.totalMarks} Marks</span>
          </div>
        </div>

        {/* Candidate Information Fill-in Box */}
        <div className="border border-slate-400 rounded-lg p-3 my-4 bg-white text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block">Candidate Name:</span>
              <div className="border-b border-dotted border-slate-400 h-5 mt-0.5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block">Roll Number:</span>
              <div className="border-b border-dotted border-slate-400 h-5 mt-0.5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block">Section / Room:</span>
              <div className="border-b border-dotted border-slate-400 h-5 mt-0.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 pt-2 border-t border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-500">Paper Setter:</span>{" "}
              <span className="font-semibold text-slate-800">{examination.paperSetterTeacher}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Invigilator&apos;s Signature:</span>{" "}
              <span className="inline-block border-b border-slate-400 w-32 align-bottom" />
            </div>
          </div>
        </div>

        {/* General Instructions */}
        {instructions && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg my-4 text-xs text-amber-950">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 block mb-1">
              General Instructions to Candidates:
            </span>
            <p className="whitespace-pre-line leading-relaxed text-[11px] font-medium">
              {instructions}
            </p>
          </div>
        )}

        {/* Structured Questions Sections */}
        <div className="space-y-6 mt-6">
          {sections && sections.length > 0 ? (
            sections.map((sec: any, sIdx: number) => (
              <div key={sIdx} className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {sec.sectionTitle || `Section ${String.fromCharCode(65 + sIdx)}`}
                  </h3>
                  {sec.instructions && (
                    <span className="text-[10px] italic text-slate-600 font-medium">
                      ({sec.instructions})
                    </span>
                  )}
                </div>

                <div className="space-y-3 pl-1">
                  {sec.questions && sec.questions.length > 0 ? (
                    sec.questions.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="flex items-start justify-between gap-4 text-xs">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="font-bold text-slate-900 min-w-[24px]">
                            {q.qNumber ? `Q${q.qNumber}.` : `Q${qIdx + 1}.`}
                          </span>
                          <div className="leading-relaxed text-slate-800 font-normal">
                            {q.questionText}
                            {q.subQuestions && q.subQuestions.length > 0 && (
                              <div className="space-y-1.5 mt-2 pl-4">
                                {q.subQuestions.map((sq: any, sqIdx: number) => (
                                  <div key={sqIdx} className="flex items-start justify-between gap-3 text-[11px]">
                                    <span>
                                      <b className="mr-1.5">({String.fromCharCode(97 + sqIdx)})</b>
                                      {sq.text}
                                    </span>
                                    {sq.marks && (
                                      <span className="font-bold font-mono text-slate-700 shrink-0">
                                        [{sq.marks}]
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {q.marks && (
                          <span className="font-bold font-mono text-xs px-2 py-0.5 bg-slate-100 border border-slate-300 rounded shrink-0 text-slate-800">
                            [{q.marks} Marks]
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No questions listed in this section.</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No structured questions entered for this paper.
            </div>
          )}
        </div>

        {/* Paper End Mark */}
        <div className="text-center pt-8 mt-8 border-t border-slate-300 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          *** End of Question Paper ***
        </div>
      </div>
    </div>
  );
}

export default function PrintQuestionPaperPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-500">
          Loading Question Paper...
        </div>
      }
    >
      <QuestionPaperContent />
    </Suspense>
  );
}
