// StudentDetail.jsx — EPR System single-record detail page
// Profile header + breadcrumb + tabbed sections (Overview / Attendance / Marks / Fees).

import React, { useState } from 'react';
import { Avatar, Badge, Button } from './Primitives';

const tabs = [
  { id: 'overview',   label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'marks',      label: 'Marks' },
  { id: 'fees',       label: 'Fees' },
];

export function StudentDetail({ student = sampleStudent, onBack }) {
  const [tab, setTab] = useState('overview');

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <Breadcrumb name={student.name} onBack={onBack} />
      <ProfileHeader student={student} />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
      }}>
        {tab === 'overview'   && <Overview student={student} />}
        {tab === 'attendance' && <AttendancePanel student={student} />}
        {tab === 'marks'      && <MarksPanel student={student} />}
        {tab === 'fees'       && <FeesPanel student={student} />}
      </div>
    </section>
  );
}

/* ────── breadcrumb ────── */

function Breadcrumb({ name, onBack }) {
  return (
    <nav aria-label="Breadcrumb" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      fontSize: 'var(--text-sm)',
      color: 'var(--color-text-muted)',
    }}>
      <a href="#" onClick={onBack} style={{ color: 'var(--color-text-secondary)' }}>Dashboard</a>
      <span aria-hidden="true">/</span>
      <a href="#" onClick={onBack} style={{ color: 'var(--color-text-secondary)' }}>Students</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page" style={{ color: 'var(--color-text)', fontWeight: 'var(--fw-medium)' }}>{name}</span>
    </nav>
  );
}

/* ────── profile header ────── */

function ProfileHeader({ student }) {
  return (
    <header style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-5)',
    }}>
      <Avatar name={student.name} size="xl" />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-bold)', margin: 0 }}>
            {student.name}
          </h1>
          <Badge variant={student.active ? 'success' : 'neutral'} dot>
            {student.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginTop: 'var(--space-2)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
        }}>
          <Meta label="Roll No." value={student.roll} mono />
          <Meta label="Class" value={student.className} />
          <Meta label="Joined" value={student.joinedAt} />
          <Meta label="Guardian" value={student.guardian} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="secondary" size="md">Edit</Button>
        <Button variant="primary" size="md">Full Report</Button>
      </div>
    </header>
  );
}

function Meta({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
        {label}
      </div>
      <div style={{
        fontWeight: 'var(--fw-medium)',
        color: 'var(--color-text)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      }}>
        {value}
      </div>
    </div>
  );
}

/* ────── tabs ────── */

function Tabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" style={{
      display: 'flex',
      gap: 'var(--space-2)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === active}
          onClick={() => onChange(t.id)}
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--fw-medium)',
            cursor: 'pointer',
            color: t.id === active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: `2px solid ${t.id === active ? 'var(--color-primary)' : 'transparent'}`,
            marginBottom: -1,
            transition: 'color var(--transition), border-color var(--transition)',
            fontFamily: 'inherit',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ────── tab panels ────── */

function Overview({ student }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
      <StatBlock label="Attendance" value={`${student.attendance}%`} accent="success" />
      <StatBlock label="Average Marks" value={`${student.averageMarks}%`} accent="primary" />
      <StatBlock label="Fee Status" value={student.feeStatus} accent={student.feeStatus === 'Paid' ? 'success' : 'warning'} />
      <StatBlock label="Days Absent" value={student.daysAbsent} accent="danger" />
    </div>
  );
}

function StatBlock({ label, value, accent }) {
  const color = {
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger:  'var(--color-danger)',
  }[accent];
  return (
    <div style={{
      padding: 'var(--space-4)',
      background: 'var(--color-bg)',
      borderRadius: 'var(--radius-md)',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text)' }}>
        {value}
      </div>
    </div>
  );
}

function AttendancePanel({ student }) {
  const days = student.attendanceWeek ?? [];
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
          <th style={thStyle}>Day</th>
          <th style={thStyle}>Date</th>
          <th style={thStyle}>Status</th>
          <th style={thStyle}>Note</th>
        </tr>
      </thead>
      <tbody>
        {days.map((d) => (
          <tr key={d.date} style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={tdStyle}>{d.day}</td>
            <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{d.date}</td>
            <td style={tdStyle}>
              {d.status === 'present' && <Badge variant="success" dot>Present</Badge>}
              {d.status === 'late'    && <Badge variant="warning" dot>Late</Badge>}
              {d.status === 'absent'  && <Badge variant="danger"  dot>Absent</Badge>}
            </td>
            <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{d.note || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MarksPanel({ student }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
          <th style={thStyle}>Subject</th>
          <th style={thStyle}>Term 1</th>
          <th style={thStyle}>Mid</th>
          <th style={thStyle}>Final</th>
          <th style={thStyle}>Grade</th>
        </tr>
      </thead>
      <tbody>
        {(student.marks ?? []).map((m) => (
          <tr key={m.subject} style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={tdStyle}>{m.subject}</td>
            <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{m.term1}</td>
            <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{m.mid}</td>
            <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{m.final}</td>
            <td style={tdStyle}>
              <Badge variant={gradeVariant(m.grade)}>{m.grade}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FeesPanel({ student }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
          <th style={thStyle}>Term</th>
          <th style={thStyle}>Amount</th>
          <th style={thStyle}>Due</th>
          <th style={thStyle}>Status</th>
        </tr>
      </thead>
      <tbody>
        {(student.fees ?? []).map((f) => (
          <tr key={f.term} style={{ borderBottom: '1px solid var(--color-border)' }}>
            <td style={tdStyle}>{f.term}</td>
            <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>PKR {f.amount.toLocaleString()}</td>
            <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{f.dueDate}</td>
            <td style={tdStyle}>
              {f.status === 'paid'    && <Badge variant="success" dot>Paid</Badge>}
              {f.status === 'pending' && <Badge variant="warning" dot>Pending</Badge>}
              {f.status === 'overdue' && <Badge variant="danger"  dot>Overdue</Badge>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ────── helpers ────── */

const thStyle = {
  textAlign: 'left',
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--fw-semibold)',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '.04em',
};

const tdStyle = {
  padding: 'var(--space-3) var(--space-4)',
  color: 'var(--color-text)',
};

function gradeVariant(grade) {
  if (grade?.startsWith('A')) return 'success';
  if (grade?.startsWith('B')) return 'primary';
  if (grade?.startsWith('C')) return 'warning';
  return 'danger';
}

const sampleStudent = {
  id: 'STU-2025-024',
  name: 'Ahmed Khan',
  roll: '042',
  className: 'Class 10-A',
  joinedAt: '2022-08-15',
  guardian: 'Mr. Imran Khan',
  active: true,
  attendance: 92,
  averageMarks: 84,
  feeStatus: 'Paid',
  daysAbsent: 4,
  attendanceWeek: [
    { day: 'Mon', date: '2026-05-25', status: 'present' },
    { day: 'Tue', date: '2026-05-26', status: 'present' },
    { day: 'Wed', date: '2026-05-27', status: 'late', note: '15 min late' },
    { day: 'Thu', date: '2026-05-28', status: 'present' },
    { day: 'Fri', date: '2026-05-29', status: 'absent', note: 'Sick leave' },
  ],
  marks: [
    { subject: 'Mathematics', term1: 88, mid: 91, final: 94, grade: 'A+' },
    { subject: 'English',     term1: 82, mid: 78, final: 85, grade: 'A' },
    { subject: 'Physics',     term1: 76, mid: 80, final: 82, grade: 'B+' },
    { subject: 'Chemistry',   term1: 70, mid: 74, final: 78, grade: 'B' },
  ],
  fees: [
    { term: 'Term 1 - 2025', amount: 25000, dueDate: '2025-08-15', status: 'paid' },
    { term: 'Term 2 - 2025', amount: 25000, dueDate: '2025-12-15', status: 'paid' },
    { term: 'Term 3 - 2026', amount: 27500, dueDate: '2026-04-15', status: 'pending' },
  ],
};
