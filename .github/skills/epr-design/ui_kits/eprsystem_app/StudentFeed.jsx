// StudentFeed.jsx — EPR System student list
// The canonical list/table view. Demonstrates all four data states:
// loading, empty, error, data.

import React from 'react';
import { Avatar, Badge, Button, Input, Spinner } from './Primitives';

export function StudentFeed({
  students,
  isLoading = false,
  error = null,
  onRetry,
  onSelect,
  onAdd,
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <Header onAdd={onAdd} />
      <Toolbar />

      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {isLoading && <LoadingState />}
        {!isLoading && error && <ErrorState error={error} onRetry={onRetry} />}
        {!isLoading && !error && students?.length === 0 && <EmptyState onAdd={onAdd} />}
        {!isLoading && !error && students?.length > 0 && (
          <StudentTable students={students} onSelect={onSelect} />
        )}
      </div>
    </section>
  );
}

/* ────── header ────── */

function Header({ onAdd }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
    }}>
      <div>
        <h1 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--fw-bold)',
          margin: 0,
          color: 'var(--color-text)',
        }}>
          Students
        </h1>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          margin: '4px 0 0',
        }}>
          Manage enrolment, attendance, and fee status.
        </p>
      </div>
      <Button variant="primary" size="md" onClick={onAdd}>
        + Add Student
      </Button>
    </header>
  );
}

function Toolbar() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-4)',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
    }}>
      <div style={{ flex: 1, maxWidth: 320 }}>
        <Input placeholder="Search by name or roll number…" />
      </div>
      <FilterChip label="Class: All" />
      <FilterChip label="Status: Active" />
      <Button variant="secondary" size="md">Export CSV</Button>
    </div>
  );
}

function FilterChip({ label }) {
  return (
    <button
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-full)',
        padding: '6px 14px',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
  );
}

/* ────── data state ────── */

function StudentTable({ students, onSelect }) {
  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 'var(--text-sm)',
    }}>
      <thead>
        <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
          <Th>Student</Th>
          <Th>Roll</Th>
          <Th>Class</Th>
          <Th>Attendance</Th>
          <Th>Fee Status</Th>
          <Th align="right">Actions</Th>
        </tr>
      </thead>
      <tbody>
        {students.map((s) => (
          <tr
            key={s.id}
            onClick={() => onSelect?.(s)}
            style={{
              borderBottom: '1px solid var(--color-border)',
              cursor: 'pointer',
              transition: 'background var(--transition)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Td>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Avatar name={s.name} size="sm" />
                <div>
                  <div style={{ fontWeight: 'var(--fw-medium)' }}>{s.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {s.guardian}
                  </div>
                </div>
              </div>
            </Td>
            <Td><code style={{ fontFamily: 'var(--font-mono)' }}>{s.roll}</code></Td>
            <Td>{s.className}</Td>
            <Td>
              <AttendanceBar percent={s.attendance} />
            </Td>
            <Td><FeeBadge status={s.feeStatus} /></Td>
            <Td align="right">
              <Button variant="ghost" size="sm">View</Button>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children, align = 'left' }) {
  return (
    <th style={{
      textAlign: align,
      padding: 'var(--space-3) var(--space-4)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--color-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '.04em',
    }}>{children}</th>
  );
}

function Td({ children, align = 'left' }) {
  return (
    <td style={{
      padding: 'var(--space-3) var(--space-4)',
      textAlign: align,
      color: 'var(--color-text)',
      verticalAlign: 'middle',
    }}>{children}</td>
  );
}

function AttendanceBar({ percent }) {
  const color = percent >= 90 ? 'var(--color-success)' :
                percent >= 75 ? 'var(--color-warning)' :
                                'var(--color-danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 100 }}>
      <div style={{
        flex: 1,
        height: 6,
        background: 'var(--color-bg)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: color,
          transition: 'width var(--transition)',
        }} />
      </div>
      <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
        {percent}%
      </span>
    </div>
  );
}

function FeeBadge({ status }) {
  if (status === 'paid')    return <Badge variant="success" dot>Paid</Badge>;
  if (status === 'pending') return <Badge variant="warning" dot>Pending</Badge>;
  if (status === 'overdue') return <Badge variant="danger"  dot>Overdue</Badge>;
  return <Badge variant="neutral">—</Badge>;
}

/* ────── loading / empty / error ────── */

function LoadingState() {
  return (
    <div style={{
      padding: 'var(--space-10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-3)',
      color: 'var(--color-text-muted)',
      fontSize: 'var(--text-sm)',
    }}>
      <Spinner size={20} color="var(--color-primary)" />
      Loading students…
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 'var(--space-4)' }} aria-hidden="true">👨‍🎓</div>
      <h3 style={{ margin: 0, marginBottom: 'var(--space-2)' }}>No students yet</h3>
      <p style={{
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
        maxWidth: 360,
        margin: '0 auto var(--space-5)',
      }}>
        Add your first student to start tracking attendance, marks, and fees.
      </p>
      <Button variant="primary" size="md" onClick={onAdd}>+ Add First Student</Button>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56,
        background: 'var(--color-danger-light)',
        color: 'var(--color-danger)',
        borderRadius: 'var(--radius-full)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        marginBottom: 'var(--space-4)',
      }} aria-hidden="true">⚠️</div>
      <h3 style={{ margin: 0, marginBottom: 'var(--space-2)' }}>Failed to load students</h3>
      <p style={{
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
        maxWidth: 360,
        margin: '0 auto var(--space-5)',
      }}>
        {error?.message || 'Check your connection and try again.'}
      </p>
      <Button variant="danger" size="md" onClick={onRetry}>Retry</Button>
    </div>
  );
}
