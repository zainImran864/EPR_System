"use client";

import React, { useState } from "react";
import { Award, Save, CheckCircle2 } from "lucide-react";
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
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useMarks } from "@/app/hooks/useMarks";
import { useClasses } from "@/app/hooks/useClasses";

// Used only for the class-average badge label — roster rows use pre-computed grade from the store.
function gradeLabel(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

function gradeBadgeVariant(grade: string): "success" | "primary" | "warning" | "neutral" {
  if (grade.startsWith("A")) return "success";
  if (grade.startsWith("B")) return "primary";
  if (grade.startsWith("C") || grade.startsWith("D")) return "warning";
  return "neutral";
}

export const MarkEntryGrid: React.FC = () => {
  const {
    exams,
    subjects,
    marksRoster,
    isLoading,
    isSaving,
    selectedExamId,
    selectedSubjectId,
    selectedClassId,
    selectedSectionId,
    setSelectedExamId,
    setSelectedSubjectId,
    setSelectedClass,
    setSelectedSection,
    updateScore,
    saveMarks,
  } = useMarks();

  const { classOptions, sectionOptions } = useClasses();

  const [savedFlash, setSavedFlash] = useState(false);

  const handleSave = async () => {
    const ok = await saveMarks();
    if (ok) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 3000);
    }
  };

  const allSelected =
    Boolean(selectedExamId) &&
    Boolean(selectedClassId) &&
    Boolean(selectedSectionId) &&
    Boolean(selectedSubjectId);

  const average =
    marksRoster.length > 0
      ? marksRoster.reduce((acc, r) => acc + (r.obtainedMarks / (r.totalMarks || 1)) * 100, 0) /
        marksRoster.length
      : 0;

  const currentSectionOptions = selectedClassId ? sectionOptions(selectedClassId) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0D9488]" aria-hidden="true" />
            Examinations & Mark Entry
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record term marks, compute automatic grading scales, and review subject performances
          </p>
        </div>

        <Button
          variant={savedFlash ? "success" : "primary"}
          size="sm"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!allSelected || marksRoster.length === 0}
          leftIcon={savedFlash ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          className="text-xs"
        >
          {savedFlash ? "Scores Published!" : "Save Gradebook"}
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3 w-full md:w-auto">
          {/* Exam picker */}
          <div className="w-48">
            <Select
              label="Examination Term"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              options={exams.map((ex) => ({ value: ex._id, label: ex.name }))}
              placeholder="Select exam"
              className="text-xs py-1.5"
            />
          </div>

          {/* Class picker */}
          <div className="w-36">
            <Select
              label="Class"
              value={selectedClassId}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={classOptions}
              placeholder="Select class"
              className="text-xs py-1.5"
            />
          </div>

          {/* Section picker — disabled until a class is chosen */}
          <div className="w-36">
            <Select
              label="Section"
              value={selectedSectionId}
              onChange={(e) => setSelectedSection(e.target.value)}
              options={currentSectionOptions}
              placeholder="Select section"
              disabled={!selectedClassId || currentSectionOptions.length === 0}
              className="text-xs py-1.5"
            />
          </div>

          {/* Subject picker */}
          <div className="w-48">
            <Select
              label="Subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              options={subjects.map((s) => ({ value: s._id, label: s.name }))}
              placeholder="Select subject"
              className="text-xs py-1.5"
            />
          </div>
        </div>

        {/* Class Average — only meaningful when data is present */}
        {allSelected && marksRoster.length > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Class Average
              </span>
              <span className="text-lg font-bold font-mono-data text-slate-900">
                {average.toFixed(1)}%
              </span>
            </div>
            <Badge variant="primary" size="md">
              Grade {gradeLabel(average)}
            </Badge>
          </div>
        )}
      </div>

      {/* Content area: no-selection / loading / empty / data */}
      {!allSelected ? (
        <EmptyState
          icon={<Award className="w-6 h-6" aria-hidden="true" />}
          title="Select exam, class, section & subject"
          description="Use the toolbar above to choose an examination term, class, section, and subject to load the marks roster."
        />
      ) : isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : marksRoster.length === 0 ? (
        <EmptyState
          icon={<Award className="w-6 h-6" aria-hidden="true" />}
          title="No students in this section"
          description="There are no students enrolled in the selected class and section, or no marks data is available yet."
        />
      ) : (
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
            {marksRoster.map((row, idx) => {
              const pct =
                row.totalMarks > 0 ? (row.obtainedMarks / row.totalMarks) * 100 : 0;
              const fullName = `${row.firstName} ${row.lastName}`;

              return (
                <TableRow key={row.studentId}>
                  <TableCell>
                    <Badge variant="neutral" size="sm" isMono>
                      {row.rollNumber}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={fullName} size="xs" />
                      <span className="font-semibold text-slate-800 text-sm">
                        {fullName}
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
                        aria-label={`Obtained marks for ${fullName}`}
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
                      variant={gradeBadgeVariant(row.grade)}
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
      )}
    </div>
  );
};
