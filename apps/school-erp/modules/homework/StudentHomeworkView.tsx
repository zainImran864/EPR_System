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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-teal-600" />
            {isParent ? 'Child Homework & Assignments' : 'My Homework & Assignments'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isParent
              ? 'View assigned homework questions, submission deadlines, and teacher grades for your child.'
              : 'View assigned questions, upload your solutions before the strict deadline, and check teacher marks.'}
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Work
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'submitted'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submitted & Graded
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({homeworkList.length})
          </button>
        </div>
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
          Loading assigned homework...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-slate-200 rounded-2xl bg-white shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">
            {activeTab === 'pending'
              ? 'All Caught Up!'
              : activeTab === 'submitted'
              ? 'No Submitted Assignments'
              : 'No Homework Found'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'pending'
              ? 'You have no pending assignments waiting for submission.'
              : 'There are no assignments matching your filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((hw) => {
            const sub = hw.submissions?.[0];
            const isOverdue = new Date() > new Date(hw.dueDate);
            const isSubmitted = !!sub;

            return (
              <div
                key={hw.id}
                className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                      {hw.subject?.name}
                    </span>

                    {/* Status Badge */}
                    {isSubmitted ? (
                      sub.status === 'GRADED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Graded: {sub.marksObtained}/{hw.maxMarks}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Submitted
                        </span>
                      )
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3 h-3" />
                        Deadline Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Due Soon
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{hw.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                    {hw.description}
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Teacher:</span>
                      <span className="font-semibold text-slate-800">
                        {hw.teacher?.fullName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Max Marks:</span>
                      <span className="font-bold text-teal-700">{hw.maxMarks}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Submission Due:</span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          isOverdue && !sub ? 'text-rose-600' : 'text-slate-800'
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
                      <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                        <span className="font-semibold block text-[10px] text-emerald-800 uppercase">Teacher Feedback:</span>
                        <p className="text-emerald-900 mt-0.5 leading-relaxed">{sub.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {hw.attachmentUrl ? (
                    <a
                      href={hw.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      Attachment
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span />
                  )}

                  {!isParent && (
                    <button
                      onClick={() => openSubmitModal(hw)}
                      disabled={isOverdue && !isSubmitted}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer ${
                        isOverdue && !isSubmitted
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : isSubmitted
                          ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      }`}
                    >
                      {isSubmitted ? 'Edit Submission' : isOverdue ? 'Locked' : 'Solve & Submit'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Solve & Submit Modal */}
      {activeHomework && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  {activeHomework.title}
                </h2>
                <span className="text-xs text-teal-700 font-semibold">
                  {activeHomework.subject?.name} • Max {activeHomework.maxMarks} Points
                </span>
              </div>
              <button
                onClick={() => setActiveHomework(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions & Instructions */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500 block uppercase">
                Questions / Instructions:
              </span>
              <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {activeHomework.description}
              </p>
              {activeHomework.attachmentUrl && (
                <div className="pt-2">
                  <a
                    href={activeHomework.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-700 hover:underline inline-flex items-center gap-1 font-semibold"
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
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800">
                  <span className="font-bold block text-rose-900">Submission Window Closed</span>
                  The deadline for this assignment expired on{' '}
                  {new Date(activeHomework.dueDate).toLocaleString()}. Unsubmitted assignments after deadline are automatically marked as 0 marks.
                </div>
              </div>
            ) : null}

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type Solved Answer / Solution Text
                </label>
                <textarea
                  rows={4}
                  disabled={new Date() > new Date(activeHomework.dueDate) && !activeHomework.submissions?.[0]}
                  placeholder="Type your answers, proofs, or notes here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Or Uploaded File / Google Drive / Cloud Link
                </label>
                <input
                  type="url"
                  disabled={new Date() > new Date(activeHomework.dueDate) && !activeHomework.submissions?.[0]}
                  placeholder="https://drive.google.com/... or https://..."
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveHomework(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>

                {!(new Date() > new Date(activeHomework.dueDate) && !activeHomework.submissions?.[0]) && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
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
