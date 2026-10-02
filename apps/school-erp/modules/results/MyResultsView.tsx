"use client";

import React from "react";
import Link from "next/link";
import { Award, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/app/hooks/useAuth";
import { useStudentResults } from "@/app/hooks/useResults";

export interface MyResultsViewProps {
  title: string;
  subtitle: string;
}

/** Aggregated exam results for the current student/parent's child. */
export const MyResultsView: React.FC<MyResultsViewProps> = ({ title, subtitle }) => {
  const { user } = useAuth();
  const ctx = user?.studentContext;
  const { results, isLoading } = useStudentResults(ctx?.studentId);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-[#0D9488]" />
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
        {ctx && (
          <p className="text-xs text-teal-600 mt-1 font-medium">
            {ctx.firstName} {ctx.lastName} · {ctx.className} · {ctx.sectionName}
          </p>
        )}
      </div>

      {!ctx ? (
        <EmptyState
          icon={<Award className="w-6 h-6" />}
          title="No student linked"
          description="This account isn't linked to a student yet. Please contact your school administrator."
        />
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Award className="w-6 h-6" />}
          title="No results published yet"
          description="Exam results will appear here once teachers publish marks."
        />
      ) : (
        results.map((exam) => (
          <Card key={exam.examId}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{exam.examName}</h3>
                    {exam.term && (
                      <Badge variant="neutral" size="sm">
                        {exam.term}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0D9488]" />
                      {exam.percentage}% · Grade {exam.overallGrade}
                    </span>
                    <span>
                      {exam.obtainedMarks} / {exam.totalMarks}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/print/report-card?student=${ctx.studentId}&exam=${exam.examId}`}
                  target="_blank"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FileText className="w-4 h-4 text-[#0D9488]" />
                  Report Card
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100">
                      <th className="text-left py-2 font-medium">Subject</th>
                      <th className="text-center py-2 font-medium">Total</th>
                      <th className="text-center py-2 font-medium">Obtained</th>
                      <th className="text-center py-2 font-medium">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exam.subjects.map((s, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-700">
                          {s.subjectName}
                        </td>
                        <td className="py-2 text-center text-slate-500">
                          {s.totalMarks}
                        </td>
                        <td className="py-2 text-center font-semibold text-slate-800">
                          {s.obtainedMarks}
                        </td>
                        <td className="py-2 text-center">
                          <Badge variant="primary" size="sm">
                            {s.grade}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
