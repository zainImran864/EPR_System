"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Award, FileText, ChevronRight, User } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useClasses } from "@/app/hooks/useClasses";
import { useStudents } from "@/app/hooks/useStudents";
import { useStudentResults } from "@/app/hooks/useResults";

const StudentResultPanel: React.FC<{ studentId: string }> = ({ studentId }) => {
  const { results, isLoading } = useStudentResults(studentId);
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!results.length)
    return (
      <p className="text-xs text-slate-400 py-6 text-center">
        No results recorded for this student yet.
      </p>
    );
  return (
    <div className="space-y-3">
      {results.map((exam) => (
        <div key={exam.examId} className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">{exam.examName}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {exam.percentage}% · Grade {exam.overallGrade} · {exam.obtainedMarks}/
                {exam.totalMarks}
              </p>
            </div>
            <Link
              href={`/print/report-card?student=${studentId}&exam=${exam.examId}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-[#0D9488]" />
              Report Card
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export const AdminResults: React.FC = () => {
  const { classOptions, sectionOptions } = useClasses();
  const { allStudents, isLoading } = useStudents();

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const sections = classId ? sectionOptions(classId) : [];
  const students = allStudents.filter(
    (s) =>
      (!classId || s.classId === classId) &&
      (!sectionId || s.sectionId === sectionId)
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-[#0D9488]" />
          Results & Report Cards
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Review any student's results and generate their printable report card.
        </p>
      </div>

      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            label="Class"
            value={classId}
            placeholder="All classes"
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId("");
              setSelectedStudent(null);
            }}
            options={[{ value: "", label: "All classes" }, ...classOptions]}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            label="Section"
            value={sectionId}
            placeholder={classId ? "All sections" : "Choose a class first"}
            disabled={!classId}
            onChange={(e) => {
              setSectionId(e.target.value);
              setSelectedStudent(null);
            }}
            options={[{ value: "", label: "All sections" }, ...sections]}
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : students.length === 0 ? (
        <EmptyState
          icon={<Award className="w-6 h-6" />}
          title="No students"
          description="Select a class and section with enrolled students."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Student list */}
          <div className="space-y-2">
            {students.map((s) => (
              <button
                key={s._id}
                onClick={() => setSelectedStudent(s._id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                  selectedStudent === s._id
                    ? "border-[#0D9488] bg-teal-50/50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <Avatar name={`${s.firstName} ${s.lastName}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono-data">
                    {s.admissionNumber}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}
          </div>

          {/* Result panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-5">
                {selectedStudent ? (
                  <StudentResultPanel studentId={selectedStudent} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                    <User className="w-8 h-8 mb-2" />
                    <p className="text-sm">Select a student to view their results.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
