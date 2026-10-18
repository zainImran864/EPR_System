'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Users,
  Paperclip,
  CheckCircle,
  AlertCircle,
  Award,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react';
import { homeworkRestApi, classesRestApi } from '@/app/api/client';
import { useAuthStore } from '@/app/store/useAuthStore';

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  attachmentUrl?: string | null;
  createdAt: string;
  class: { id: string; name: string };
  section: { id: string; name: string };
  subject: { id: string; name: string; code: string };
  teacher: { id: string; fullName: string };
  submissions?: {
    id: string;
    studentId: string;
    status: string;
    isLate: boolean;
    marksObtained?: number | null;
  }[];
}

interface SubmissionDetail {
  id: string;
  studentId: string;
  student: { id: string; fullName: string; rollNumber?: string; admissionNumber?: string };
  submissionUrl?: string | null;
  content?: string | null;
  submittedAt: string;
  isLate: boolean;
  marksObtained?: number | null;
  feedback?: string | null;
  status: string;
}

export function TeacherHomeworkView() {
  const { user } = useAuthStore();
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Submissions Drawer/Modal
  const [activeHomework, setActiveHomework] = useState<HomeworkItem | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDetail[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [marksInput, setMarksInput] = useState<{ [id: string]: number }>({});
  const [feedbackInput, setFeedbackInput] = useState<{ [id: string]: string }>({});
  const [savingGrade, setSavingGrade] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hwRes, clsRes] = await Promise.all([
        homeworkRestApi.list(),
        classesRestApi.getAll().catch(() => []),
      ]);
      setHomeworkList(hwRes || []);
      setClasses(clsRes || []);
    } catch (err) {
      console.error('Failed to load homework:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSectionId || !selectedSubjectId || !title || !dueDate) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await homeworkRestApi.create({
        classId: selectedClassId,
        sectionId: selectedSectionId,
        subjectId: selectedSubjectId,
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
        maxMarks: Number(maxMarks) || 100,
        attachmentUrl: attachmentUrl.trim() || undefined,
      });

      setCreateOpen(false);
      setTitle('');
      setDescription('');
      setSelectedClassId('');
      setSelectedSectionId('');
      setSelectedSubjectId('');
      setDueDate('');
      setMaxMarks(100);
      setAttachmentUrl('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create homework assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmissions = async (hw: HomeworkItem) => {
    try {
      setActiveHomework(hw);
      setLoadingSubmissions(true);
      const data = await homeworkRestApi.getSubmissions(hw.id);
      setSubmissions(data || []);
      const initialMarks: { [id: string]: number } = {};
      const initialFeedback: { [id: string]: string } = {};
      (data || []).forEach((s: SubmissionDetail) => {
        if (s.marksObtained !== null && s.marksObtained !== undefined) {
          initialMarks[s.id] = s.marksObtained;
        }
        if (s.feedback) {
          initialFeedback[s.id] = s.feedback;
        }
      });
      setMarksInput(initialMarks);
      setFeedbackInput(initialFeedback);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGrade = async (submissionId: string) => {
    const marks = marksInput[submissionId];
    if (marks === undefined || marks < 0) {
      alert('Please enter valid positive marks');
      return;
    }
    try {
      setSavingGrade(true);
      await homeworkRestApi.grade(submissionId, {
        marksObtained: Number(marks),
        feedback: feedbackInput[submissionId] || undefined,
      });
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                marksObtained: Number(marks),
                feedback: feedbackInput[submissionId],
                status: 'GRADED',
              }
            : s,
        ),
      );
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save grade');
    } finally {
      setSavingGrade(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this homework assignment?')) return;
    try {
      await homeworkRestApi.delete(id);
      setHomeworkList((prev) => prev.filter((hw) => hw.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete assignment');
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const availableSections = selectedClass?.sections || [];
  const availableSubjects = selectedClass?.subjects || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-teal-600" />
            Homework & Assignments Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create class assignments with strict deadlines, inspect student answers, and assign grades.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-xs active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Assign New Homework
        </button>
      </div>

      {/* Homework List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
          Loading assignments...
        </div>
      ) : homeworkList.length === 0 ? (
        <div className="p-12 text-center border border-slate-200 rounded-2xl bg-white shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No Homework Assigned Yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Click &quot;Assign New Homework&quot; above to create assignments for your class and section.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {homeworkList.map((hw) => {
            const isOverdue = new Date() > new Date(hw.dueDate);
            const submissionsCount = hw.submissions?.length || 0;

            return (
              <div
                key={hw.id}
                className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                      {hw.subject?.name || 'Subject'}
                    </span>
                    <button
                      onClick={() => handleDelete(hw.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{hw.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {hw.description}
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Class & Section:</span>
                      <span className="font-semibold text-slate-800">
                        {hw.class?.name} - {hw.section?.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Maximum Marks:</span>
                      <span className="font-bold text-teal-700">{hw.maxMarks}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Due Deadline:</span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          isOverdue ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(hw.dueDate).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {isOverdue && (
                      <span className="inline-block mt-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        Submissions Locked (Deadline Passed)
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {submissionsCount} Submitted
                  </span>

                  <button
                    onClick={() => openSubmissions(hw)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Review & Grade
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Submissions Modal / Drawer */}
      {activeHomework && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-teal-600" />
                  Review Submissions: {activeHomework.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Class: {activeHomework.class?.name} - {activeHomework.section?.name} | Max Points: {activeHomework.maxMarks}
                </p>
              </div>
              <button
                onClick={() => setActiveHomework(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingSubmissions ? (
                <div className="p-8 text-center text-slate-500">Loading student solutions...</div>
              ) : submissions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                  No students have submitted solutions yet.
                </div>
              ) : (
                submissions.map((sub) => {
                  const isGraded = sub.status === 'GRADED';
                  const isMissed = sub.status === 'MISSED';

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            {sub.student?.fullName}
                            <span className="text-xs text-slate-500 font-normal">
                              (Roll: {sub.student?.rollNumber || 'N/A'})
                            </span>
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Submitted:{' '}
                            {new Date(sub.submittedAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {sub.isLate && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Late Submission
                            </span>
                          )}
                          {isMissed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Locked (0 Marks)
                            </span>
                          ) : isGraded ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Graded: {sub.marksObtained}/{activeHomework.maxMarks}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Pending Grade
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content or link */}
                      {sub.content && (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {sub.content}
                        </div>
                      )}

                      {sub.submissionUrl && (
                        <a
                          href={sub.submissionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Uploaded Homework Document / Image
                        </a>
                      )}

                      {/* Grading inputs */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                          <div className="w-28 shrink-0">
                            <label className="block text-[10px] text-slate-500 uppercase font-semibold">Marks</label>
                            <input
                              type="number"
                              min={0}
                              max={activeHomework.maxMarks}
                              value={marksInput[sub.id] ?? ''}
                              onChange={(e) =>
                                setMarksInput({ ...marksInput, [sub.id]: Number(e.target.value) })
                              }
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bold"
                            />
                          </div>

                          <div className="flex-1">
                            <label className="block text-[10px] text-slate-500 uppercase font-semibold">Teacher Feedback</label>
                            <input
                              type="text"
                              value={feedbackInput[sub.id] ?? ''}
                              onChange={(e) =>
                                setFeedbackInput({ ...feedbackInput, [sub.id]: e.target.value })
                              }
                              placeholder="e.g. Well written, clear explanation."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleGrade(sub.id)}
                          disabled={savingGrade}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-all self-end sm:self-center shrink-0 disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
                        >
                          {isGraded ? 'Update Grade' : 'Save Grade'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Homework Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-teal-600" />
              Assign New Homework
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    required
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedSectionId('');
                      setSelectedSubjectId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section *</label>
                  <select
                    required
                    disabled={!selectedClassId}
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-50"
                  >
                    <option value="">-- Select Section --</option>
                    {availableSections.map((sec: any) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
                <select
                  required
                  disabled={!selectedClassId}
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-50"
                >
                  <option value="">-- Select Subject --</option>
                  {availableSubjects.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Homework Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4: Linear Equations Practice Set"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Questions & Instructions *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter assignment questions, textbook page numbers, and solution guidelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Marks *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Sheet Attachment Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Assigning...' : 'Assign Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
