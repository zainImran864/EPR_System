"use client";

import React, { useState } from "react";
import { Award, Save, Calculator, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Avatar } from "@/components/ui/Avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/Table";

export interface StudentScoreRow {
  studentId: string;
  name: string;
  rollNumber: string;
  totalMarks: number;
  obtainedMarks: number;
  grade: string;
}

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

export const MarkEntryGrid: React.FC = () => {
  const [selectedExam, setSelectedExam] = useState("mid-2026");
  const [selectedSubject, setSelectedSubject] = useState("math-10");
  const [isSaved, setIsSaved] = useState(false);

  const [scores, setScores] = useState<StudentScoreRow[]>([
    {
      studentId: "s1",
      name: "Aiden Clark",
      rollNumber: "10-A-01",
      totalMarks: 100,
      obtainedMarks: 92,
      grade: "A+",
    },
    {
      studentId: "s2",
      name: "Sophia Martinez",
      rollNumber: "10-A-02",
      totalMarks: 100,
      obtainedMarks: 88,
      grade: "A",
    },
    {
      studentId: "s3",
      name: "Ethan Wright",
      rollNumber: "10-A-03",
      totalMarks: 100,
      obtainedMarks: 76,
      grade: "B",
    },
    {
      studentId: "s4",
      name: "Liam Chen",
      rollNumber: "10-A-04",
      totalMarks: 100,
      obtainedMarks: 95,
      grade: "A+",
    },
    {
      studentId: "s5",
      name: "Emma Davis",
      rollNumber: "10-A-05",
      totalMarks: 100,
      obtainedMarks: 84,
      grade: "A",
    },
  ]);

  const updateScore = (index: number, val: number) => {
    const updated = [...scores];
    const clamped = Math.max(0, Math.min(100, val || 0));
    updated[index].obtainedMarks = clamped;
    updated[index].grade = calculateGrade(
      (clamped / updated[index].totalMarks) * 100
    );
    setScores(updated);
    setIsSaved(false);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const average =
    scores.reduce((acc, s) => acc + s.obtainedMarks, 0) / (scores.length || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0D9488]" />
            Examinations & Mark Entry
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record term marks, compute automatic grading scales, and review subject performances
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          leftIcon={<Save className="w-4 h-4" />}
          className="text-xs"
        >
          {isSaved ? "Scores Published!" : "Save Gradebook"}
        </Button>
      </div>

      {/* Selector Filters */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="w-48">
            <Select
              label="Examination Term"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              options={[
                { value: "mid-2026", label: "Mid-Term Exam 2026" },
                { value: "final-2026", label: "Final Examination 2026" },
              ]}
              className="text-xs py-1.5"
            />
          </div>

          <div className="w-48">
            <Select
              label="Subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              options={[
                { value: "math-10", label: "Advanced Mathematics" },
                { value: "phy-10", label: "Physics & Mechanics" },
                { value: "eng-10", label: "English Literature" },
              ]}
              className="text-xs py-1.5"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Class Average
            </span>
            <span className="text-lg font-bold font-mono-data text-slate-900">
              {average.toFixed(1)}%
            </span>
          </div>
          <Badge variant="primary" size="md">
            Grade {calculateGrade(average)}
          </Badge>
        </div>
      </div>

      {/* Marks Matrix Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Roll No</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead>Total Marks</TableHead>
            <TableHead>Obtained Marks</TableHead>
            <TableHead>Percentage</TableHead>
            <TableHead>Grade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scores.map((row, idx) => {
            const pct = (row.obtainedMarks / row.totalMarks) * 100;
            return (
              <TableRow key={row.studentId}>
                <TableCell>
                  <Badge variant="neutral" size="sm" isMono>
                    {row.rollNumber}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={row.name} size="xs" />
                    <span className="font-semibold text-slate-800 text-sm">
                      {row.name}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="font-mono-data text-slate-500 text-xs">
                  {row.totalMarks}
                </TableCell>

                <TableCell>
                  <div className="w-24">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={row.obtainedMarks}
                      onChange={(e) =>
                        updateScore(idx, parseInt(e.target.value) || 0)
                      }
                      className="w-full font-mono-data text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-mono-data font-semibold text-slate-700">
                    {pct.toFixed(0)}%
                  </span>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      row.grade.startsWith("A")
                        ? "success"
                        : row.grade.startsWith("B")
                        ? "primary"
                        : "warning"
                    }
                    size="sm"
                    isMono
                  >
                    {row.grade}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

