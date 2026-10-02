"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { studentsRestApi, marksRestApi } from "@/app/api/client";
import { useToast } from "@/app/hooks/useToast";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface ProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProgressionModal: React.FC<ProgressionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [passingThreshold, setPassingThreshold] = useState(40);
  const [loadingExams, setLoadingExams] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [decisions, setDecisions] = useState<Record<string, "PROMOTE" | "RETAIN" | "DEMOTE">>({});
  const [applying, setApplying] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLoadingExams(true);
      marksRestApi
        .getExams()
        .then((res) => {
          setExams(res || []);
          if (res && res.length > 0) {
            setSelectedExamId(res[0].id);
          }
        })
        .catch(() => setExams([]))
        .finally(() => setLoadingExams(false));
    }
  }, [isOpen]);

  const handleEvaluate = async () => {
    if (!selectedExamId) {
      error("Please choose a final examination term.");
      return;
    }

    setEvaluating(true);
    try {
      const res = await studentsRestApi.autoProgress({
        finalExamTermId: selectedExamId,
        passingThreshold,
        autoPromotePassing: true,
      });
      setResult(res);

      // Initialize default decisions for action-required students
      const initialDecisions: Record<string, "PROMOTE" | "RETAIN" | "DEMOTE"> = {};
      res.actionRequiredStudents?.forEach((st: any) => {
        initialDecisions[st.studentId] =
          st.suggestedAction === "PROMOTE_WITH_GRACE" ? "PROMOTE" : "RETAIN";
      });
      setDecisions(initialDecisions);
      success(`Academic Progression Complete! ${res.autoPromotedCount} passing students promoted.`);
    } catch (err: any) {
      error(err.message || "Failed to process academic progression.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleApplyDecisions = async () => {
    if (!result || !result.actionRequiredStudents) return;
    setApplying(true);
    try {
      const payload = Object.entries(decisions).map(([studentId, action]) => ({
        studentId,
        action,
      }));
      await studentsRestApi.applyProgressionDecisions(payload);
      success("Individual retention and promotion decisions applied successfully.");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      error(err.message || "Failed to apply student decisions.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Academic Year Promotion & Progression Engine"
      description="Automatically evaluate final term results, promote passing students to their next grade, and review students requiring academic intervention."
      size="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {result && result.actionRequiredStudents?.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleApplyDecisions}
              isLoading={applying}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Apply All Decisions
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* Step 1: Configuration */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Final Examination Term"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            options={exams.map((ex) => ({
              value: ex.id,
              label: `${ex.name} (${ex.academicYear})`,
            }))}
            disabled={loadingExams || evaluating}
          />
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Passing Mark Threshold ({passingThreshold}%)
            </label>
            <input
              type="range"
              min={33}
              max={60}
              value={passingThreshold}
              onChange={(e) => setPassingThreshold(Number(e.target.value))}
              className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>33% Minimum</span>
              <span>40% Standard</span>
              <span>60% Strict</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={handleEvaluate}
            isLoading={evaluating}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Run Automated Student Promotion
          </Button>
        </div>

        {/* Results Summary & Review Grid */}
        {result && (
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200 text-center">
                <span className="text-[11px] font-bold text-teal-800 uppercase block">
                  Auto-Promoted to Next Class
                </span>
                <span className="text-2xl font-black text-teal-900 mt-1 block">
                  {result.autoPromotedCount}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                  Total Students Passed
                </span>
                <span className="text-2xl font-black text-emerald-900 mt-1 block">
                  {result.passedStudentsCount}
                </span>
              </div>
              <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-center">
                <span className="text-[11px] font-bold text-rose-800 uppercase block">
                  Requires Admin Review
                </span>
                <span className="text-2xl font-black text-rose-900 mt-1 block">
                  {result.actionRequiredStudents?.length || 0}
                </span>
              </div>
            </div>

            {/* Failing / Marginal Students Decision Table */}
            {result.actionRequiredStudents?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Students Under Threshold — Action Selection:
                </h4>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {result.actionRequiredStudents.map((st: any) => (
                    <div
                      key={st.studentId}
                      className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{st.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {st.currentClassName} ({st.currentSectionName}) · Score: <strong>{st.percentage}%</strong> ({st.failingSubjects} Failing Papers)
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setDecisions({ ...decisions, [st.studentId]: "PROMOTE" })
                          }
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                            decisions[st.studentId] === "PROMOTE"
                              ? "bg-teal-600 text-white border-teal-600 shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Promote
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDecisions({ ...decisions, [st.studentId]: "RETAIN" })
                          }
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                            decisions[st.studentId] === "RETAIN"
                              ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Retain
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDecisions({ ...decisions, [st.studentId]: "DEMOTE" })
                          }
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                            decisions[st.studentId] === "DEMOTE"
                              ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          Demote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
