"use client";

import React, { useEffect, useState } from "react";
import { marksRestApi } from "@/app/api/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  BookOpen,
  Users,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface ExamAnalyticsCardProps {
  examTermId: string;
  sectionId?: string;
}

export const ExamAnalyticsCard: React.FC<ExamAnalyticsCardProps> = ({
  examTermId,
  sectionId,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!examTermId) return;
    let isMounted = true;
    setLoading(true);

    marksRestApi
      .getExamAnalytics(examTermId, sectionId)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch(() => {
        if (isMounted) setData(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [examTermId, sectionId]);

  if (!examTermId) return null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!data || data.totalStudentsAppeared === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Academic Performance & Analytics Engine
        </h3>
        <Badge variant="primary" size="sm">
          {data.totalStudentsAppeared} Students Evaluated
        </Badge>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-teal-50 to-white border border-teal-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Average Class Score</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-900 mt-2">
            {data.averageScore}%
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-0.5">
            Passing Threshold: 40%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Overall Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-2">
            {data.passPercentage}%
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {data.totalStudentsAppeared} Total Enrolled
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Top Performer</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-950 truncate mt-2">
            {data.topPerformers?.[0]?.name || "—"}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
            {data.topPerformers?.[0]?.percentage ? `${data.topPerformers[0].percentage}% (Grade A+)` : "No scores"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-50 to-white border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">At-Risk Students</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-900 mt-2">
            {data.atRiskStudents?.length || 0}
          </div>
          <div className="text-[11px] text-rose-700 font-medium mt-0.5">
            Requires Intervention
          </div>
        </div>
      </div>

      {/* Grade Distribution & Subject Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Grade Distribution */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-6 gap-2 text-center">
              {Object.entries(data.gradeDistribution || {}).map(([grade, count]) => (
                <div
                  key={grade}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div className="text-xs font-bold text-slate-700">{grade}</div>
                  <div className="text-base font-extrabold text-teal-600 mt-0.5">
                    {String(count)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subject-Wise Difficulty & Pass Rate */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Subject Difficulty & Pass Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {data.subjectAnalytics?.map((sub: any) => (
                <div
                  key={sub.subjectName}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-semibold text-slate-800">{sub.subjectName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      Avg: <strong className="text-slate-800">{sub.averagePercentage}%</strong>
                    </span>
                    <Badge
                      variant={
                        sub.difficulty === "ACCESSIBLE"
                          ? "success"
                          : sub.difficulty === "MODERATE"
                          ? "info"
                          : "warning"
                      }
                      size="sm"
                    >
                      {sub.difficulty}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Warning Alerts (if any) */}
      {data.atRiskStudents && data.atRiskStudents.length > 0 && (
        <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-xs">
          <div className="flex items-center gap-2 font-bold text-rose-800 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Early Warning: Students Identified for Remedial Support</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.atRiskStudents.slice(0, 4).map((st: any) => (
              <div
                key={st.studentId}
                className="p-2 bg-white rounded-lg border border-rose-100 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-800">{st.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {st.className} ({st.sectionName}) · Overall {st.percentage}%
                  </div>
                </div>
                <Badge variant="danger" size="sm">
                  {st.riskLevel} RISK
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
