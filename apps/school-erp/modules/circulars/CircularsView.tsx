'use client';

import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  Plus,
  Pin,
  Calendar,
  Trash2,
  Paperclip,
  Users,
} from 'lucide-react';
import { circularsRestApi, classesRestApi } from '@/app/api/client';
import { useAuthStore } from '@/app/store/useAuthStore';

interface Circular {
  id: string;
  title: string;
  content: string;
  authorRole: string;
  targetType: string;
  classId?: string | null;
  sectionId?: string | null;
  class?: { id: string; name: string } | null;
  section?: { id: string; name: string } | null;
  attachmentUrl?: string | null;
  isPinned?: boolean;
  publishedBy?: string;
  createdAt: string;
}

interface ClassItem {
  id: string;
  name: string;
  sections?: { id: string; name: string }[];
}

export function CircularsView({ mode = 'auto' }: { mode?: 'admin' | 'teacher' | 'student' | 'parent' | 'auto' }) {
  const { user } = useAuthStore();
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pinned'>('all');
  const [search, setSearch] = useState('');

  // Creation modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const canCreate =
    user?.role === 'ADMIN' ||
    user?.role === 'SUPERADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'TEACHER';

  const loadData = async () => {
    try {
      setLoading(true);
      const [listRes, classRes] = await Promise.all([
        circularsRestApi.list(),
        classesRestApi.getAll().catch(() => []),
      ]);
      setCirculars(listRes || []);
      setClasses(classRes || []);
    } catch (err) {
      console.error('Failed to load circulars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      await circularsRestApi.create({
        title,
        content,
        targetType,
        classId: (targetType === 'CLASS' || targetType === 'SECTION') ? selectedClassId || undefined : undefined,
        sectionId: targetType === 'SECTION' ? selectedSectionId || undefined : undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
        isPinned,
      });
      // Reset form
      setTitle('');
      setContent('');
      setTargetType('ALL');
      setSelectedClassId('');
      setSelectedSectionId('');
      setAttachmentUrl('');
      setIsPinned(false);
      setModalOpen(false);

      // Reload
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish circular');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this circular announcement?')) return;
    try {
      await circularsRestApi.delete(id);
      setCirculars((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete circular');
    }
  };

  // Filter circulars
  const filtered = circulars.filter((c) => {
    if (activeTab === 'pinned' && !c.isPinned) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchBody = c.content.toLowerCase().includes(q);
      const matchType = c.targetType.toLowerCase().includes(q);
      const matchClass = c.class?.name.toLowerCase().includes(q);
      if (!matchTitle && !matchBody && !matchType && !matchClass) return false;
    }
    return true;
  });

  const getTargetLabel = (c: Circular) => {
    if (c.targetType === 'ALL') return 'Whole School';
    if (c.targetType === 'TEACHERS') return 'Teachers Only';
    if (c.targetType === 'STUDENTS') return 'Students Only';
    if (c.targetType === 'PARENTS') return 'Parents Only';
    if (c.targetType === 'CLASS') return `Class: ${c.class?.name || 'Assigned'}`;
    if (c.targetType === 'SECTION') return `Section: ${c.class?.name || ''} - ${c.section?.name || 'Assigned'}`;
    return c.targetType;
  };

  const activeClass = classes.find((cls) => cls.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-teal-600" />
            Official Circulars & Announcements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            School-wide and targeted class/section notices, circulars, and official updates.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-xs active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Publish Circular
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 self-start">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Notices ({circulars.length})
          </button>
          <button
            onClick={() => setActiveTab('pinned')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pinned'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            Pinned ({circulars.filter((c) => c.isPinned).length})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search circulars by title, content, class..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-full sm:w-72 shadow-2xs"
        />
      </div>

      {/* Circulars List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
          Loading circulars...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-slate-200 rounded-2xl bg-white shadow-xs">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No Circulars Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            There are currently no circulars or announcements matching your filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const isAuthorOrAdmin =
              user?.role === 'ADMIN' ||
              user?.role === 'SUPERADMIN' ||
              user?.role === 'SUPER_ADMIN' ||
              (item.publishedBy === user?.name || item.authorRole === user?.role);

            return (
              <div
                key={item.id}
                className={`p-6 rounded-2xl border transition-all ${
                  item.isPinned
                    ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          <Pin className="w-3 h-3 fill-current" />
                          Pinned Notice
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                        <Users className="w-3 h-3" />
                        {getTargetLabel(item)}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 pt-1">{item.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>By <strong className="text-slate-700">{item.publishedBy || item.authorRole}</strong></span>
                    </div>
                  </div>

                  {isAuthorOrAdmin && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all self-end sm:self-start cursor-pointer"
                      title="Delete Circular"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {item.content}
                </div>

                {item.attachmentUrl && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-teal-600" />
                    <a
                      href={item.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-600 hover:text-teal-700 hover:underline font-semibold truncate"
                    >
                      View Attachment / Document Link
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Publish Circular Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-teal-600" />
              Publish Circular / Announcement
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-term Exam Schedule & Preparation Guidelines"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience *</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="ALL">Entire School (All Students, Parents & Staff)</option>
                  {user?.role !== 'STUDENT' && user?.role !== 'PARENT' && (
                    <option value="TEACHERS">Teachers Only</option>
                  )}
                  <option value="STUDENTS">Students Only</option>
                  <option value="PARENTS">Parents Only</option>
                  <option value="CLASS">Target Specific Class</option>
                  <option value="SECTION">Target Specific Section</option>
                </select>
              </div>

              {/* Class Selector */}
              {(targetType === 'CLASS' || targetType === 'SECTION') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Class *</label>
                  <select
                    required
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedSectionId('');
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Section Selector */}
              {targetType === 'SECTION' && selectedClassId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Section *</label>
                  <select
                    required
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="">-- Choose Section --</option>
                    {activeClass?.sections?.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  Pin Notice to Top
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Body *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter full announcement details here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attachment or Drive Link (Optional)</label>
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
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-all cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {submitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
