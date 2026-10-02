"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, Plus, Trash2, Save, MapPin, Users, Info } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Switch } from "@/components/ui/Switch";
import { DAYS, PERIODS } from "@/app/api/timetable";
import { useClasses } from "@/app/hooks/useClasses";
import { useTeachers } from "@/app/hooks/useTeachers";
import { useSectionTimetable } from "@/app/hooks/useTimetable";
import { useToast } from "@/app/hooks/useToast";

const ROOM_PRESETS = [
  "Room 101",
  "Room 102",
  "Room 201",
  "Room 202",
  "Science Lab",
  "Computer Lab",
  "Auditorium",
  "Library",
  "Gymnasium",
  "Art Studio",
];

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
        label: `${t.firstName} ${t.lastName} (${t.designation || "Teacher"})`,
      })),
    ],
    [teachers]
  );

  const [editing, setEditing] = useState<{ day: number; period: number } | null>(
    null
  );
  const [form, setForm] = useState({
    subjectName: "",
    teacherId: "",
    room: "",
    allowCombinedClass: false,
  });
  const [saving, setSaving] = useState(false);

  const cell = (day: number, period: number) =>
    slots.find((s) => s.dayOfWeek === day && s.period === period);

  const openCell = (day: number, period: number) => {
    const existing = cell(day, period);
    setForm({
      subjectName: existing?.subjectName ?? "",
      teacherId: existing?.teacherId ?? "",
      room: existing?.room ?? "",
      allowCombinedClass: false,
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
      success("Slot saved successfully.");
      setEditing(null);
    } catch (err: any) {
      error(err?.message || "Could not save slot.");
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
          Timetable & Room Schedule Builder
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Build the weekly master schedule per section. Rooms can be shared across classes (e.g. Auditorium / Lab) and teacher schedules update in real time.
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
                <th className="p-2.5 text-left font-semibold text-slate-500 border-b border-slate-200 sticky left-0 bg-slate-50 min-w-[90px]">
                  Day
                </th>
                {PERIODS.map((p) => (
                  <th
                    key={p.period}
                    className="p-2.5 text-center font-semibold text-slate-500 border-b border-l border-slate-200 min-w-[130px]"
                  >
                    <div className="font-bold text-slate-800">P{p.period}</div>
                    <div className="text-[10px] font-normal text-slate-400 font-mono-data">
                      {p.startTime}–{p.endTime}
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
                          className={`w-full text-left rounded-lg p-2 transition-all ${
                            c
                              ? "bg-[#F0FDFA] border border-teal-200 hover:bg-teal-100/60 shadow-2xs"
                              : "border border-dashed border-slate-200 text-slate-300 hover:border-teal-300 hover:text-teal-500 flex items-center justify-center h-12"
                          }`}
                        >
                          {c ? (
                            <>
                              <div className="font-semibold text-teal-900 leading-tight text-xs">
                                {c.subjectName}
                              </div>
                              {c.teacherName && (
                                <div className="text-[10px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
                                  <Users className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{c.teacherName}</span>
                                </div>
                              )}
                              {c.room && (
                                <div className="text-[10px] text-teal-700 mt-1 flex items-center gap-1 font-medium">
                                  <MapPin className="w-2.5 h-2.5 text-teal-600" />
                                  <span>Room {c.room}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <Plus className="w-4 h-4" />
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
        description="Assign a subject, teacher, and classroom number to this period."
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
                Remove Slot
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
              Save Slot
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Subject *"
            placeholder="e.g. Mathematics, Physics, Physical Education"
            value={form.subjectName}
            onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
          />
          <Select
            label="Teacher Assigned"
            value={form.teacherId}
            onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
            options={teacherOptions}
          />
          <div>
            <Input
              label="Classroom / Room Number"
              placeholder="e.g. Room 101, Lab 2, Auditorium"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ROOM_PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setForm({ ...form, room: preset })}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors border border-slate-200/60"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Multi-Class & Shared Room Support</p>
              <p>Two or more classes can be assigned to the same room simultaneously (e.g. Auditorium, Gymnasium, combined lectures).</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
