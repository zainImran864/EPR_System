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
  const [gradingId, setGradingId] = useState<string | null>(null);
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
    setActiveHomework(hw);
    try {
      setLoadingSubmissions(true);
      const details = await homeworkRestApi.getById(hw.id);
      setSubmissions(details.submissions || []);
      const initialMarks: { [id: string]: number } = {};
      const initialFeedback: { [id: string]: string } = {};
      (details.submissions || []).forEach((s: SubmissionDetail) => {
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
      // update local submission
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
      setGradingId(null);
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
      setHomeworkList((prev) => prev.filter((h) => h.id !== id));
      if (activeHomework?.id === id) setActiveHomework(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete homework');
    }
  };

  const activeClass = classes.find((c) => c.id === selectedClassId);
  const availableSections = activeClass?.sections || [];
  const availableSubjects = activeClass?.subjects || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-gold" />
            Homework & Assignments Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create class assignments with strict deadlines, inspect student answers, and assign grades.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-black bg-brand-gold hover:bg-amber-400 transition-all shadow-md active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Assign New Homework
        </button>
      </div>

      {/* Homework List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading assignments...</div>
      ) : homeworkList.length === 0 ? (
        <div className="p-12 text-center border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Homework Assigned Yet</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Click &quot;Assign New Homework&quot; above to create assignments for your class and section.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homeworkList.map((hw) => {
            const isOverdue = new Date() > new Date(hw.dueDate);
            const submissionsCount = hw.submissions?.length || 0;

            return (
              <div
                key={hw.id}
                className="p-5 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between hover:border-white/20 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                      {hw.subject?.name || 'Subject'}
                    </span>
                    <button
                      onClick={() => handleDelete(hw.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-1">{hw.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {hw.description}
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target:</span>
                      <span className="font-medium text-white">
                        {hw.class?.name} - {hw.section?.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Max Marks:</span>
                      <span className="font-semibold text-brand-gold">{hw.maxMarks} Marks</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Submission Due:</span>
                      <span
                        className={`font-medium flex items-center gap-1 ${
                          isOverdue ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {new Date(hw.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{submissionsCount} Submissions</span>
                  </div>

                  <button
                    onClick={() => openSubmissions(hw)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold hover:text-amber-400 transition-colors"
                  >
                    Review Submissions
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Submissions Modal */}
      {activeHomework && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-semibold text-brand-gold uppercase tracking-wider">
                  {activeHomework.subject?.name} • {activeHomework.class?.name} - {activeHomework.section?.name}
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">{activeHomework.title}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Due: {new Date(activeHomework.dueDate).toLocaleString()} • Max Marks: {activeHomework.maxMarks}
                </p>
              </div>

              <button
                onClick={() => setActiveHomework(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {loadingSubmissions ? (
                <div className="p-8 text-center text-slate-400">Loading student submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No students have submitted solutions yet for this assignment.
                </div>
              ) : (
                submissions.map((sub) => {
                  const isGraded = sub.status === 'GRADED';

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-white text-sm">
                            {sub.student?.fullName}
                            <span className="text-xs text-slate-400 font-normal ml-2">
                              (Roll: {sub.student?.rollNumber || sub.student?.admissionNumber || 'N/A'})
                            </span>
                          </h4>
                          <span className="text-xs text-slate-400">
                            Submitted: {new Date(sub.submittedAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {sub.isLate && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Overdue / Late (0 Marks)
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                              isGraded
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isGraded ? `Graded: ${sub.marksObtained} / ${activeHomework.maxMarks}` : 'Pending Grading'}
                          </span>
                        </div>
                      </div>

                      {/* Content or Document link */}
                      {sub.content && (
                        <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          <span className="text-slate-500 font-medium block mb-1">Student Answer:</span>
                          {sub.content}
                        </div>
                      )}

                      {sub.submissionUrl && (
                        <div className="flex items-center gap-2 text-xs">
                          <Paperclip className="w-3.5 h-3.5 text-brand-gold" />
                          <a
                            href={sub.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-gold hover:underline font-medium inline-flex items-center gap-1"
                          >
                            View Uploaded File / Solution Link
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {/* Grading Controls */}
                      <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-1 items-center gap-3">
                          <div className="w-28">
                            <label className="block text-[10px] text-slate-400 uppercase font-semibold">Marks</label>
                            <input
                              type="number"
                              min={0}
                              max={activeHomework.maxMarks}
                              value={marksInput[sub.id] ?? ''}
                              onChange={(e) =>
                                setMarksInput({ ...marksInput, [sub.id]: Number(e.target.value) })
                              }
                              placeholder={`0 - ${activeHomework.maxMarks}`}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-gold"
                            />
                          </div>

                          <div className="flex-1">
                            <label className="block text-[10px] text-slate-400 uppercase font-semibold">Teacher Feedback</label>
                            <input
                              type="text"
                              value={feedbackInput[sub.id] ?? ''}
                              onChange={(e) =>
                                setFeedbackInput({ ...feedbackInput, [sub.id]: e.target.value })
                              }
                              placeholder="e.g. Well written, clear explanation."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-gold"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleGrade(sub.id)}
                          disabled={savingGrade}
                          className="px-3.5 py-2 rounded-lg text-xs font-semibold text-black bg-brand-gold hover:bg-amber-400 transition-all self-end sm:self-center shrink-0 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-brand-gold" />
              Assign New Homework
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Class *</label>
                  <select
                    required
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedSectionId('');
                      setSelectedSubjectId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Section *</label>
                  <select
                    required
                    disabled={!selectedClassId}
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold disabled:opacity-50"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Subject *</label>
                <select
                  required
                  disabled={!selectedClassId}
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold disabled:opacity-50"
                >
                  <option value="">-- Select Subject --</option>
                  {availableSubjects.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code || 'SUB'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quadratic Equations Practice Exercises 4.1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Questions & Instructions *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the homework questions, exercise numbers, or guidelines for students..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Strict Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-gold"
                  >
                  </input>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Marks *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Question Sheet Attachment Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-black bg-brand-gold hover:bg-amber-400 transition-all shadow-md disabled:opacity-50"
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
