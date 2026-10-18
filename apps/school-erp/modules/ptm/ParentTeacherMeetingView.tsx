'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  Building,
  UserCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ptmRestApi, studentsRestApi } from '@/app/api/client';
import { useAuthStore } from '@/app/store/useAuthStore';

interface Meeting {
  id: string;
  meetingDate: string;
  timeSlot: string;
  mode: string;
  agenda: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  teacherNotes?: string | null;
  parentNotes?: string | null;
  createdAt: string;
  teacher: { id: string; fullName: string; email: string; phone?: string | null };
  parent?: { id: string; fullName: string; email: string; phone?: string | null } | null;
  student: {
    id: string;
    fullName: string;
    rollNumber?: string | null;
    admissionNumber?: string | null;
    class?: { id: string; name: string } | null;
    section?: { id: string; name: string } | null;
  };
}

export function ParentTeacherMeetingView() {
  const { user } = useAuthStore();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduling modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 10:30 AM');
  const [mode, setMode] = useState('IN_PERSON');
  const [agenda, setAgenda] = useState('');
  const [notes, setNotes] = useState('');

  // Status update modal / action
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const isTeacher = user?.role === 'TEACHER';
  const isParent = user?.role === 'PARENT';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'SUPER_ADMIN';

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, sRes] = await Promise.all([
        ptmRestApi.list(),
        isTeacher || isAdmin ? studentsRestApi.getAll().catch(() => []) : Promise.resolve([]),
      ]);
      setMeetings(mRes || []);
      setStudents(sRes || []);
    } catch (err) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.studentContext?.studentId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudentId = isParent
      ? user?.studentContext?.studentId || (meetings[0]?.student?.id ?? '')
      : selectedStudentId;

    if (!targetStudentId || !meetingDate || !agenda.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await ptmRestApi.create({
        studentId: targetStudentId,
        meetingDate,
        timeSlot,
        mode,
        agenda: agenda.trim(),
        notes: notes.trim() || undefined,
      });

      setModalOpen(false);
      setSelectedStudentId('');
      setMeetingDate('');
      setTimeSlot('10:00 AM - 10:30 AM');
      setMode('IN_PERSON');
      setAgenda('');
      setNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED') => {
    if (!activeMeeting) return;
    try {
      setUpdating(true);
      await ptmRestApi.updateStatus(activeMeeting.id, {
        status,
        notes: actionNotes.trim() || undefined,
      });
      setActiveMeeting(null);
      setActionNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update meeting status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Pending Response
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-gold" />
            Parent-Teacher Meetings (PTM)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Schedule direct one-on-one conferences between parents and teachers for student academic reviews.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-black bg-brand-gold hover:bg-amber-400 transition-all shadow-md active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {isTeacher ? 'Invite Parent to Meeting' : 'Request Meeting with Teacher'}
        </button>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading scheduled meetings...</div>
      ) : meetings.length === 0 ? (
        <div className="p-12 text-center border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Meetings Scheduled</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            There are no parent-teacher meetings requested or scheduled currently.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((m) => {
            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between hover:border-white/20 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-slate-200 border border-white/10">
                        {m.mode === 'ONLINE' ? <Video className="w-3.5 h-3.5 text-blue-400" /> : <Building className="w-3.5 h-3.5 text-amber-400" />}
                        {m.mode.replace('_', ' ')}
                      </span>
                      {getStatusBadge(m.status)}
                    </div>

                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono-data">
                      <Calendar className="w-3.5 h-3.5" />
                      {m.meetingDate}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {m.student?.fullName}
                      <span className="text-xs text-slate-400 font-normal">
                        ({m.student?.class?.name} - {m.student?.section?.name})
                      </span>
                    </h3>
                    <p className="text-xs text-brand-gold mt-0.5">
                      Teacher: {m.teacher?.fullName} ({m.teacher?.email})
                    </p>
                    {m.parent && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Parent: {m.parent.fullName} ({m.parent.email})
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs">
                    <span className="text-slate-400 font-semibold block uppercase text-[10px]">Agenda:</span>
                    <p className="text-slate-200 leading-relaxed">{m.agenda}</p>
                  </div>

                  {(m.teacherNotes || m.parentNotes) && (
                    <div className="pt-2 text-xs text-slate-400 space-y-1">
                      {m.teacherNotes && (
                        <div>
                          <strong className="text-slate-300">Teacher Notes:</strong> {m.teacherNotes}
                        </div>
                      )}
                      {m.parentNotes && (
                        <div>
                          <strong className="text-slate-300">Parent Notes:</strong> {m.parentNotes}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {m.timeSlot}
                  </span>

                  {m.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setActiveMeeting(m);
                        setActionNotes('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black bg-brand-gold hover:bg-amber-400 transition-all shadow-sm"
                    >
                      Respond / Confirm
                    </button>
                  )}

                  {m.status === 'APPROVED' && (
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmed Meeting
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Response Modal */}
      {activeMeeting && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">Update Meeting Status</h3>
            <p className="text-xs text-slate-400 mb-4">
              Meeting regarding <strong>{activeMeeting.student?.fullName}</strong> on {activeMeeting.meetingDate} at {activeMeeting.timeSlot}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Discussion Notes or Reply (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter notes or discussion summary..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveMeeting(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleStatusUpdate('REJECTED')}
                  disabled={updating}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleStatusUpdate('APPROVED')}
                  disabled={updating}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-black bg-brand-gold hover:bg-amber-400 transition-all shadow-md"
                >
                  Accept & Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-brand-gold" />
              {isTeacher ? 'Schedule Meeting with Parent' : 'Request Meeting with Teacher'}
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              {!isParent && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Student *</label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.fullName} ({st.class?.name || ''} - {st.section?.name || ''} / Roll: {st.rollNumber || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Time Slot *</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                    <option value="09:30 AM - 10:00 AM">09:30 AM - 10:00 AM</option>
                    <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                    <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                    <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                    <option value="01:00 PM - 01:30 PM">01:00 PM - 01:30 PM</option>
                    <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Meeting Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
                >
                  <option value="IN_PERSON">In-Person (School Campus Room)</option>
                  <option value="ONLINE">Online Video Call (Virtual)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Meeting Agenda & Topics *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Mid-term mathematics test review, attendance regularity, and classroom engagement..."
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-black bg-brand-gold hover:bg-amber-400 transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Send Meeting Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
