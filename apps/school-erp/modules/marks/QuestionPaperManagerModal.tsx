"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  Clock,
  Award,
  AlertCircle,
  Eye,
  Check,
  FileCheck,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { marksRestApi } from "@/app/api/client";
import { useToast } from "@/app/hooks/useToast";
import { useConfirmDialog } from "@/app/hooks/useConfirmDialog";

interface QuestionPaperManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  examTermId: string;
  examTermName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  isTeacher?: boolean;
}

interface QuestionItem {
  qNumber: string;
  questionText: string;
  marks: number;
}

export const QuestionPaperManagerModal: React.FC<QuestionPaperManagerModalProps> = ({
  isOpen,
  onClose,
  examTermId,
  examTermName,
  classId,
  className,
  subjectId,
  subjectName,
  isTeacher,
}) => {
  const { success, error } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [durationHours, setDurationHours] = useState(2.5);
  const [totalMarks, setTotalMarks] = useState(100);
  const [instructions, setInstructions] = useState(
    "1. Attempt all questions.\n2. Write your Roll Number and Name clearly.\n3. Calculators are prohibited.",
  );
  const [fileUrl, setFileUrl] = useState("");
  const [questions, setQuestions] = useState<QuestionItem[]>([
    { qNumber: "1", questionText: "Define key concepts and core principles.", marks: 10 },
    { qNumber: "2", questionText: "Explain the theoretical framework and distinguish components.", marks: 15 },
    { qNumber: "3", questionText: "Solve the primary calculation problems with step-by-step logic.", marks: 25 },
    { qNumber: "4", questionText: "Detailed analytical question with diagrams and application case.", marks: 50 },
  ]);

  const loadPapers = async () => {
    if (!examTermId || !classId || !subjectId) return;
    setLoading(true);
    try {
      const list = await marksRestApi.getQuestionPapers({
        examTermId,
        classId,
        subjectId,
      });
      setPapers(list || []);
    } catch (err: any) {
      error("Failed to load question papers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPapers();
      setTitle(`${subjectName} Examination Paper`);
      setIsCreating(false);
    }
  }, [isOpen, examTermId, classId, subjectId]);

  const handleSetActive = async (paperId: string) => {
    try {
      const res = await marksRestApi.setActiveQuestionPaper(paperId);
      success(res.message || "Paper selected as active exam question paper.");
      loadPapers();
    } catch (err: any) {
      error(err.message || "Failed to set active paper.");
    }
  };

  const handleDelete = async (paperId: string) => {
    const ok = await confirm({
      title: "Delete Question Paper",
      message: "Are you sure you want to delete this question paper version? This action cannot be undone.",
      variant: "danger",
      confirmText: "Delete Paper",
    });
    if (!ok) return;

    try {
      await marksRestApi.deleteQuestionPaper(paperId);
      success("Question paper deleted.");
      loadPapers();
    } catch (err: any) {
      error(err.message || "Failed to delete question paper.");
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        qNumber: String(questions.length + 1),
        questionText: "",
        marks: 10,
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, patch: Partial<QuestionItem>) => {
    setQuestions(questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error("Paper title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const structuredSections = [
        {
          sectionTitle: "Official Examination Questions",
          instructions: instructions,
          questions: questions.map((q) => ({
            qNumber: q.qNumber,
            questionText: q.questionText,
            marks: Number(q.marks) || 10,
          })),
        },
      ];

      await marksRestApi.createQuestionPaper({
        examTermId,
        classId,
        subjectId,
        title: title.trim(),
        durationHours: Number(durationHours) || 2.5,
        totalMarks: Number(totalMarks) || 100,
        instructions: instructions.trim(),
        fileUrl: fileUrl.trim() || undefined,
        questionsJson: JSON.stringify(structuredSections),
      });

      success("Question paper uploaded successfully.");
      setIsCreating(false);
      loadPapers();
    } catch (err: any) {
      error(err.message || "Failed to create question paper.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exam Question Papers & Printing"
      description={`Manage, upload multiple versions, select the official active paper, and print formatted exam question sheets for ${subjectName} (${className} — ${examTermName}).`}
      size="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Close
          </Button>
          {!isCreating && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreating(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Upload / Author New Paper
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Header Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              {className}
            </Badge>
            <Badge variant="neutral" size="sm">
              {subjectName}
            </Badge>
            <Badge variant="info" size="sm">
              {examTermName}
            </Badge>
          </div>
          {papers.length > 0 && !isCreating && (
            <span className="text-xs text-slate-500 font-medium">
              {papers.length} {papers.length === 1 ? "version" : "versions"} uploaded
            </span>
          )}
        </div>

        {/* View Mode: Papers List */}
        {!isCreating && (
          <div className="space-y-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading question papers...</div>
            ) : papers.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Question Papers Uploaded Yet</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Teachers can upload multiple versions (Set A, Set B, etc.) and choose the final active paper for printing.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Create First Question Paper
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {papers.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border transition-all ${
                      p.isActiveForExam
                        ? "border-teal-400 bg-teal-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                          <Badge variant="neutral" size="sm">
                            v{p.version}
                          </Badge>
                          {p.isActiveForExam ? (
                            <Badge variant="success" size="sm" dot>
                              Active Exam Paper
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Alternate Version
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5 font-mono-data">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {p.durationHours} Hours
                          </span>
                          <span>&middot;</span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-slate-400" />
                            {p.totalMarks} Total Marks
                          </span>
                          <span>&middot;</span>
                          <span>Setter: {p.teacher?.fullName || "Subject Teacher"}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {!p.isActiveForExam && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleSetActive(p.id)}
                            leftIcon={<Check className="w-3.5 h-3.5 text-teal-600" />}
                          >
                            Set Active
                          </Button>
                        )}

                        <Link
                          href={`/print/question-paper?paperId=${p.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print Paper
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete paper"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create / Upload Mode */}
        {isCreating && (
          <form onSubmit={handleCreatePaper} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Paper Title *"
                  placeholder="e.g. Mathematics Midterm Paper — Set A"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <Input
                label="Duration (Hours) *"
                type="number"
                step="0.5"
                min="0.5"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value) || 2.5)}
                leftIcon={<Clock className="w-3.5 h-3.5 text-slate-400" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Maximum Marks *"
                type="number"
                min="1"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value) || 100)}
                leftIcon={<Award className="w-3.5 h-3.5 text-slate-400" />}
                required
              />
              <Input
                label="Optional Document / Docx URL"
                placeholder="https://... or uploaded file path"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">General Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="Instructions for students taking this exam..."
              />
            </div>

            {/* Structured Questions Builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Structured Examination Questions ({questions.length})
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={addQuestion}
                  leftIcon={<Plus className="w-3 h-3" />}
                >
                  Add Question
                </Button>
              </div>

              <div className="space-y-2.5 max-h-[35vh] overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5"
                  >
                    <div className="w-16 shrink-0">
                      <Input
                        label={`Q#`}
                        value={q.qNumber}
                        onChange={(e) => updateQuestion(idx, { qNumber: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        label="Question Text"
                        placeholder="Write question description or prompt..."
                        value={q.questionText}
                        onChange={(e) => updateQuestion(idx, { questionText: e.target.value })}
                        required
                      />
                    </div>
                    <div className="w-20 shrink-0">
                      <Input
                        label="Marks"
                        type="number"
                        min="1"
                        value={q.marks}
                        onChange={(e) =>
                          updateQuestion(idx, { marks: Number(e.target.value) || 10 })
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      disabled={questions.length === 1}
                      className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 self-end mb-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={submitting}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Save &amp; Register Paper
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Reusable Confirmation Dialog */}
      <ConfirmDialog />
    </Modal>
  );
};
