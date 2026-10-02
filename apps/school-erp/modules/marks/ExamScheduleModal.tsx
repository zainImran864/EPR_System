"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Clock, Plus, Trash2, Save, MapPin, BookOpen, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { marksRestApi } from "@/app/api/client";
import { useToast } from "@/app/hooks/useToast";

interface ExamScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  examTermId: string;
  examTermName: string;
  classId: string;
  className: string;
  subjects: { _id: string; name: string; code?: string }[];
}

interface ScheduleRow {
  id?: string;
  subjectId: string;
  paperDate: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks: number;
  roomNumber: string;
}

export const ExamScheduleModal: React.FC<ExamScheduleModalProps> = ({
  isOpen,
  onClose,
  examTermId,
  examTermName,
  classId,
  className,
  subjects,
}) => {
  const { success, error } = useToast();
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !examTermId || !classId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await marksRestApi.getPaperSchedules(examTermId, classId);
        if (data && data.length > 0) {
          setSchedules(
            data.map((item: any) => ({
              id: item.id,
              subjectId: item.subjectId,
              paperDate: item.paperDate ? item.paperDate.split("T")[0] : "",
              startTime: item.startTime || "09:00 AM",
              endTime: item.endTime || "12:00 PM",
              totalMarks: item.totalMarks || 100,
              passingMarks: item.passingMarks || 40,
              roomNumber: item.roomNumber || "Hall A",
            }))
          );
        } else {
          // Pre-populate with subjects of the class
          setSchedules(
            subjects.map((sub, idx) => {
              const d = new Date();
              d.setDate(d.getDate() + idx + 1);
              return {
                subjectId: sub._id,
                paperDate: d.toISOString().split("T")[0],
                startTime: "09:00 AM",
                endTime: "12:00 PM",
                totalMarks: 100,
                passingMarks: 40,
                roomNumber: "Hall A",
              };
            })
          );
        }
      } catch (err: any) {
        error("Failed to load paper schedule.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, examTermId, classId, subjects]);

  const addRow = () => {
    const firstSub = subjects[0]?._id || "";
    const d = new Date();
    d.setDate(d.getDate() + schedules.length + 1);
    setSchedules([
      ...schedules,
      {
        subjectId: firstSub,
        paperDate: d.toISOString().split("T")[0],
        startTime: "09:00 AM",
        endTime: "12:00 PM",
        totalMarks: 100,
        passingMarks: 40,
        roomNumber: "Hall A",
      },
    ]);
  };

  const updateRow = (index: number, patch: Partial<ScheduleRow>) => {
    setSchedules(schedules.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeRow = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (schedules.length === 0) {
      error("Add at least one subject paper schedule.");
      return;
    }
    setSaving(true);
    try {
      await marksRestApi.savePaperSchedules({
        examTermId,
        classId,
        schedules: schedules.map((s) => ({
          subjectId: s.subjectId,
          paperDate: s.paperDate,
          startTime: s.startTime,
          endTime: s.endTime,
          totalMarks: Number(s.totalMarks) || 100,
          passingMarks: Number(s.passingMarks) || 40,
          roomNumber: s.roomNumber || "Hall A",
        })),
      });
      success("Exam date-sheet saved successfully.");
      onClose();
    } catch (err: any) {
      error(err.message || "Failed to save paper schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exam Date-Sheet & Paper Schedule"
      description={`Configure examination dates, timings, rooms, and total marks for ${className} (${examTermName}). This schedule will appear on official Roll Number Slips.`}
      size="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Date-Sheet
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              {className}
            </Badge>
            <Badge variant="neutral" size="sm">
              {examTermName}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={addRow}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Subject Paper
          </Button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading schedule...</div>
        ) : schedules.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Papers Scheduled</p>
            <p className="text-xs text-slate-400 mt-1 mb-3">
              Click &quot;Add Subject Paper&quot; to configure the date-sheet for this class.
            </p>
            <Button variant="primary" size="xs" onClick={addRow} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add First Paper
            </Button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {schedules.map((row, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Subject *"
                    value={row.subjectId}
                    onChange={(e) => updateRow(idx, { subjectId: e.target.value })}
                    options={subjects.map((s) => ({ value: s._id, label: s.name }))}
                  />
                  <Input
                    label="Paper Date *"
                    type="date"
                    value={row.paperDate}
                    onChange={(e) => updateRow(idx, { paperDate: e.target.value })}
                    leftIcon={<Calendar className="w-3.5 h-3.5 text-slate-400" />}
                  />
                  <Input
                    label="Room / Hall"
                    placeholder="e.g. Hall A, Room 102"
                    value={row.roomNumber}
                    onChange={(e) => updateRow(idx, { roomNumber: e.target.value })}
                    leftIcon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                  <Input
                    label="Start Time"
                    placeholder="09:00 AM"
                    value={row.startTime}
                    onChange={(e) => updateRow(idx, { startTime: e.target.value })}
                    leftIcon={<Clock className="w-3.5 h-3.5 text-slate-400" />}
                  />
                  <Input
                    label="End Time"
                    placeholder="12:00 PM"
                    value={row.endTime}
                    onChange={(e) => updateRow(idx, { endTime: e.target.value })}
                    leftIcon={<Clock className="w-3.5 h-3.5 text-slate-400" />}
                  />
                  <Input
                    label="Total Marks"
                    type="number"
                    min="1"
                    value={row.totalMarks}
                    onChange={(e) =>
                      updateRow(idx, { totalMarks: Number(e.target.value) || 100 })
                    }
                  />
                  <Input
                    label="Pass Marks"
                    type="number"
                    min="1"
                    value={row.passingMarks}
                    onChange={(e) =>
                      updateRow(idx, { passingMarks: Number(e.target.value) || 40 })
                    }
                  />
                  <div className="flex justify-end pb-1">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove paper"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span>
            Once saved, these paper schedules will be dynamically printed on each student&apos;s
            official Roll Number / Admit Card Slip along with instructions and candidate photo.
          </span>
        </div>
      </div>
    </Modal>
  );
};
