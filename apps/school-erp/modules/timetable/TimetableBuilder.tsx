"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, Plus, Trash2, Save } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { DAYS, PERIODS } from "@/app/api/timetable";
import { useClasses } from "@/app/hooks/useClasses";
import { useTeachers } from "@/app/hooks/useTeachers";
import { useSectionTimetable } from "@/app/hooks/useTimetable";
import { useToast } from "@/app/hooks/useToast";

export const TimetableBuilder: React.FC = () => {
  const { classOptions, sectionOptions } = useClasses();
  const { teachers } = useTeachers();
  const { success, error } = useToast();

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const { slots, setSlot, deleteSlot } = useSectionTimetable(classId, sectionId);

  const sections = classId ? sectionOptions(classId) : [];

  const teacherOptions = useMemo(
    () => [
      { value: "", label: "— No teacher —" },
      ...teachers.map((t) => ({
        value: t._id,
        label: `${t.firstName} ${t.lastName}`,
      })),
    ],
    [teachers]
  );

  const [editing, setEditing] = useState<{ day: number; period: number } | null>(
    null
  );
  const [form, setForm] = useState({ subjectName: "", teacherId: "", room: "" });
  const [saving, setSaving] = useState(false);

  const cell = (day: number, period: number) =>
    slots.find((s) => s.dayOfWeek === day && s.period === period);

  const openCell = (day: number, period: number) => {
    const existing = cell(day, period);
    setForm({
      subjectName: existing?.subjectName ?? "",
      teacherId: existing?.teacherId ?? "",
      room: existing?.room ?? "",
    });
    setEditing({ day, period });
  };

  const handleSave = async () => {
    if (!editing || !form.subjectName.trim()) return;
    const p = PERIODS.find((x) => x.period === editing.period)!;
    setSaving(true);
    try {
      await setSlot({
        classId,
        sectionId,
        dayOfWeek: editing.day,
        period: editing.period,
        startTime: p.startTime,
        endTime: p.endTime,
        subjectName: form.subjectName.trim(),
        teacherId: form.teacherId || undefined,
        room: form.room || undefined,
      });
      success("Slot saved.");
      setEditing(null);
    } catch {
      error("Could not save slot.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slotId?: string) => {
    if (!slotId) return;
    try {
      await deleteSlot(slotId);
      success("Slot removed.");
      setEditing(null);
    } catch {
      error("Could not remove slot.");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#0D9488]" />
          Timetable Builder
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Build the weekly schedule per section. Teacher timetables fill in
          automatically.
        </p>
      </div>

      {/* Section picker */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            label="Class"
            value={classId}
            placeholder="Select class"
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId("");
            }}
            options={classOptions}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            label="Section"
            value={sectionId}
            placeholder={classId ? "Select section" : "Choose a class first"}
            disabled={!classId}
            onChange={(e) => setSectionId(e.target.value)}
            options={sections}
          />
        </div>
      </div>

      {!classId || !sectionId ? (
        <EmptyState
          icon={<CalendarDays className="w-6 h-6" />}
          title="Pick a class & section"
          description="Select a class and section above to start building its weekly timetable."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-2.5 text-left font-semibold text-slate-500 border-b border-slate-200 sticky left-0 bg-slate-50">
                  Day
                </th>
                {PERIODS.map((p) => (
                  <th
                    key={p.period}
                    className="p-2.5 text-center font-semibold text-slate-500 border-b border-l border-slate-200 min-w-[110px]"
                  >
                    <div>P{p.period}</div>
                    <div className="text-[10px] font-normal text-slate-400 font-mono-data">
                      {p.startTime}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day.value}>
                  <td className="p-2.5 font-semibold text-slate-700 border-b border-slate-100 sticky left-0 bg-white">
                    {day.short}
                  </td>
                  {PERIODS.map((p) => {
                    const c = cell(day.value, p.period);
                    return (
                      <td key={p.period} className="p-1.5 border-b border-l border-slate-100">
                        <button
                          onClick={() => openCell(day.value, p.period)}
                          className={`w-full text-left rounded-lg px-2 py-1.5 transition-colors ${
                            c
                              ? "bg-[#F0FDFA] border border-teal-100 hover:bg-teal-100/60"
                              : "border border-dashed border-slate-200 text-slate-300 hover:border-teal-300 hover:text-teal-500 flex items-center justify-center h-9"
                          }`}
                        >
                          {c ? (
                            <>
                              <div className="font-semibold text-teal-800 leading-tight">
                                {c.subjectName}
                              </div>
                              {c.teacherName && (
                                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                  {c.teacherName}
                                </div>
                              )}
                            </>
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cell editor */}
      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={
          editing
            ? `${DAYS.find((d) => d.value === editing.day)?.label} · Period ${editing.period}`
            : ""
        }
        description="Assign a subject and teacher to this period."
        size="md"
        footer={
          <>
            {editing && cell(editing.day, editing.period) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(cell(editing.day, editing.period)?._id)}
                leftIcon={<Trash2 className="w-4 h-4" />}
                className="mr-auto text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Remove
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={saving}
              disabled={!form.subjectName.trim()}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Subject *"
            placeholder="e.g. Mathematics"
            value={form.subjectName}
            onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
          />
          <Select
            label="Teacher"
            value={form.teacherId}
            onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
            options={teacherOptions}
          />
          <Input
            label="Room"
            placeholder="e.g. 204"
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};
