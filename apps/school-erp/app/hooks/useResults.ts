"use client";

import { useEffect, useState } from "react";
import { marksRestApi } from "@/app/api/client";
import { useActiveSchool } from "./useActiveSchool";

/** A student's aggregated results across all exams (student/parent view). */
export function useStudentResults(studentId?: string | null) {
  const { schoolId } = useActiveSchool();
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;
    setIsLoading(true);
    marksRestApi
      .getStudentReportCard(studentId)
      .then((res: any) => {
        if (mounted && res) {
          if (res.reportType === 'FULL_YEAR_CUMULATIVE' && Array.isArray(res.terms)) {
            const normalized = res.terms.map((t: any, idx: number) => ({
              examId: t.termId || t.examTermId || t.id || `term-${t.termName || idx}`,
              examName: t.termName || `Term ${idx + 1}`,
              percentage: t.percentage ?? 0,
              overallGrade: t.grade || '-',
              obtainedMarks: t.totalObtained ?? 0,
              totalMarks: t.totalPossible ?? 0,
              subjects: t.marks || [],
            }));
            setResults(normalized);
          } else if (res.reportType === 'TERM_WISE') {
            setResults([
              {
                examId: res.examTerm?.id || 'term-1',
                examName: res.examTerm?.name || 'Term Exam',
                term: res.examTerm?.termType,
                percentage: res.summary?.overallPercentage ?? 0,
                overallGrade: res.summary?.overallGrade ?? '-',
                obtainedMarks: res.summary?.totalObtained ?? 0,
                totalMarks: res.summary?.totalPossible ?? 0,
                subjects: res.subjects || [],
              },
            ]);
          } else if (Array.isArray(res)) {
            setResults(
              res.map((r: any, idx: number) => ({
                ...r,
                examId: r.examId || r.examTermId || r.id || `exam-${idx}`,
                examName: r.examName || r.name || r.examTerm?.name || `Exam ${idx + 1}`,
                percentage: r.percentage ?? r.summary?.overallPercentage ?? 0,
                overallGrade: r.overallGrade ?? r.grade ?? r.summary?.overallGrade ?? '-',
                obtainedMarks: r.obtainedMarks ?? r.totalObtained ?? r.summary?.totalObtained ?? 0,
                totalMarks: r.totalMarks ?? r.totalPossible ?? r.summary?.totalPossible ?? 0,
                subjects: r.subjects || r.marks || [],
              })),
            );
          } else {
            setResults([
              {
                examId: res.examId || res.id || 'exam-default',
                examName: res.examName || res.name || 'Academic Report',
                percentage: res.percentage ?? res.summary?.overallPercentage ?? 0,
                overallGrade: res.overallGrade ?? res.grade ?? res.summary?.overallGrade ?? '-',
                obtainedMarks: res.obtainedMarks ?? res.summary?.totalObtained ?? 0,
                totalMarks: res.totalMarks ?? res.summary?.totalPossible ?? 0,
                subjects: res.subjects || res.marks || [],
              },
            ]);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentId, schoolId]);

  return { results, isLoading };
}

/** Full printable report-card payload for one student + exam. */
export function useReportCard(studentId?: string | null, examId?: string | null) {
  const { schoolId } = useActiveSchool();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;
    setIsLoading(true);
    marksRestApi
      .getStudentReportCard(studentId, examId || undefined)
      .then((res) => {
        if (mounted && res) setReport(res);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentId, examId, schoolId]);

  return { report, isLoading };
}
