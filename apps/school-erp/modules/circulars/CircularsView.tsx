'use client';

import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  Plus,
  Pin,
  Calendar,
  AlertCircle,
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
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish circular');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this circular?')) return;
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
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-brand-gold" />
            Official Circulars & Announcements
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            School-wide and targeted class/section notices, circulars, and official updates.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-black bg-brand-gold hover:bg-amber-400 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Publish Circular
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 border border-white/10 p-1 rounded-xl bg-white/5 backdrop-blur-sm self-start">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'all' ? 'bg-brand-gold text-black shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Notices ({circulars.length})
          </button>
          <button
            onClick={() => setActiveTab('pinned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              activeTab === 'pinned' ? 'bg-brand-gold text-black shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Pin className="w-3 h-3" />
            Pinned ({circulars.filter((c) => c.isPinned).length})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search circulars by title, class..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold/50 w-full sm:w-64"
        />
      </div>

      {/* Circulars List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading circulars...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
          <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Circulars Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
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
                className={`p-5 rounded-2xl border transition-all ${
                  item.isPinned
                    ? 'border-brand-gold/40 bg-brand-gold/5 shadow-lg shadow-brand-gold/5'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
                          <Pin className="w-3 h-3 fill-current" />
                          Pinned
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        <Users className="w-3 h-3" />
                        {getTargetLabel(item)}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-white pt-1">{item.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>By {item.publishedBy || item.authorRole}</span>
                    </div>
                  </div>

                  {isAuthorOrAdmin && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all self-end sm:self-start"
                      title="Delete Circular"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-3 text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                  {item.content}
                </div>

                {item.attachmentUrl && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-brand-gold" />
                    <a
                      href={item.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-gold hover:underline font-medium truncate"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-brand-gold" />
              Publish Circular / Announcement
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-term Exam Schedule & Preparation Guidelines"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Audience *</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Class *</label>
                  <select
                    required
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedSectionId('');
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Section *</label>
                  <select
                    required
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
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

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-gold focus:ring-0 bg-white/10 border-white/20"
                  />
                  Pin Notice to Top
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Announcement Body *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter full announcement details here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Attachment or Drive Link (Optional)</label>
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
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-black bg-brand-gold hover:bg-amber-400 transition-all shadow-md disabled:opacity-50"
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
