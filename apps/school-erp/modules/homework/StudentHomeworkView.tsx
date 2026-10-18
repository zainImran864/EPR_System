'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  ExternalLink,
  Send,
  X,
  Award,
  Calendar,
} from 'lucide-react';
import { homeworkRestApi } from '@/app/api/client';
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
    feedback?: string | null;
    content?: string | null;
    submissionUrl?: string | null;
    submittedAt?: string;
  }[];
}

export function StudentHomeworkView({ isParent = false }: { isParent?: boolean }) {
  const { user } = useAuthStore();
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'all'>('pending');

  // Submit modal
  const [activeHomework, setActiveHomework] = useState<HomeworkItem | null>(null);
  const [content, setContent] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await homeworkRestApi.list();
      setHomeworkList(res || []);
    } catch (err) {
      console.error('Failed to load student homework:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.studentContext?.studentId]);

  const openSubmitModal = (hw: HomeworkItem) => {
    setActiveHomework(hw);
    const existing = hw.submissions?.[0];
    setContent(existing?.content || '');
    setSubmissionUrl(existing?.submissionUrl || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHomework) return;

    if (!content.trim() && !submissionUrl.trim()) {
      alert('Please enter your written solution or provide a file URL');
      return;
    }

    try {
      setSubmitting(true);
      await homeworkRestApi.submit(activeHomework.id, {
        content: content.trim() || undefined,
        submissionUrl: submissionUrl.trim() || undefined,
      });
      setActiveHomework(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = homeworkList.filter((hw) => {
    const sub = hw.submissions?.[0];
    const isSubmitted = !!sub;
    if (activeTab === 'pending') return !isSubmitted;
    if (activeTab === 'submitted') return isSubmitted;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-gold" />
            {isParent ? 'Child Homework & Assignments' : 'My Homework & Assignments'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isParent
              ? 'View assigned homework questions, submission deadlines, and teacher grades for your child.'
              : 'View assigned questions, upload your solutions before the strict deadline, and check teacher marks.'}
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border border-white/10 p-1 rounded-xl bg-white/5 backdrop-blur-sm self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'pending' ? 'bg-brand-gold text-black shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Work
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'submitted' ? 'bg-brand-gold text-black shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Submitted & Graded
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'all' ? 'bg-brand-gold text-black shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({homeworkList.length})
          </button>
        </div>
      </div>

      {/* Homework Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading assignments...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">All Caught Up!</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            There are no assignments matching this filter right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((hw) => {
            const sub = hw.submissions?.[0];
            const isOverdue = new Date() > new Date(hw.dueDate);
            const isGraded = sub?.status === 'GRADED';
            const isLate = sub?.isLate;

            return (
              <div
                key={hw.id}
                className="p-5 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between hover:border-white/20 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                      {hw.subject?.name}
                    </span>

                    {/* Status Badge */}
                    {isGraded ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Award className="w-3 h-3" />
                        {sub?.marksObtained} / {hw.maxMarks} Marks
                      </span>
                    ) : sub ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Submitted
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <AlertCircle className="w-3 h-3" />
                        Deadline Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Clock className="w-3 h-3" />
                        Due Soon
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-1">{hw.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {hw.description}
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Teacher:</span>
                      <span className="font-medium text-white">
                        {hw.teacher?.fullName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Max Marks:</span>
                      <span className="font-semibold text-brand-gold">{hw.maxMarks}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Submission Due:</span>
                      <span
                        className={`font-medium flex items-center gap-1 ${
                          isOverdue && !sub ? 'text-rose-400' : 'text-slate-300'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {new Date(hw.dueDate).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {sub?.feedback && (
                      <div className="mt-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs">
                        <span className="font-semibold block text-[10px] text-emerald-400 uppercase">Teacher Feedback:</span>
                        {sub.feedback}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  {hw.attachmentUrl ? (
                    <a
                      href={hw.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-gold hover:underline inline-flex items-center gap-1"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      Question File
                    </a>
                  ) : (
                    <span className="text-xs text-slate-600">No attachments</span>
                  )}

                  <button
                    onClick={() => openSubmitModal(hw)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      sub
                        ? 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10'
                        : isOverdue
                        ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                        : 'text-black bg-brand-gold hover:bg-amber-400 shadow-sm'
                    }`}
                  >
                    {sub ? 'View Submission' : isOverdue ? 'Overdue (View)' : 'Solve & Submit'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Solve & Submit Modal */}
      {activeHomework && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-xs font-semibold text-brand-gold uppercase tracking-wider">
                  {activeHomework.subject?.name} • Max Marks: {activeHomework.maxMarks}
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">{activeHomework.title}</h2>
              </div>
              <button
                onClick={() => setActiveHomework(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions & Instructions */}
            <div className="mt-4 p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-xs font-semibold text-slate-400 block uppercase">
                Questions / Instructions:
              </span>
              <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {activeHomework.description}
              </p>
              {activeHomework.attachmentUrl && (
                <div className="pt-2">
                  <a
                    href={activeHomework.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-gold hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Open Attached Assignment Worksheet
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Strict Deadline Warning */}
            {new Date() > new Date(activeHomework.dueDate) && !activeHomework.submissions?.[0] ? (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-200">
                  <span className="font-bold block text-rose-300">Submission Window Closed</span>
                  The deadline for this assignment expired on{' '}
                  {new Date(activeHomework.dueDate).toLocaleString()}. Unsubmitted assignments after deadline are automatically marked as 0 marks.
                </div>
              </div>
            ) : null}

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Type Solved Answer / Solution Text
                </label>
                <textarea
                  rows={4}
                  disabled={new Date() > new Date(activeHomework.dueDate) && !activeHomework.submissions?.[0]}
                  placeholder="Type your answers, proofs, or notes here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-gold disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Or Uploaded File / Google Drive / Cloud Link
                </label>
                <input
                  type="url"
                  disabled={new Date() > new Date(activeHomework.dueDate) && !activeHomework.submissions?.[0]}
                  placeholder="https://drive.google.com/... or https://..."
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-gold disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveHomework(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
                >
                  Close
                </button>

                {!(new Date() > new Date(activeHomework.dueDate) && !activeHomework.submissions?.[0]) && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium text-black bg-brand-gold hover:bg-amber-400 transition-all shadow-md disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Submitting...' : activeHomework.submissions?.[0] ? 'Update Submission' : 'Submit Assignment'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
