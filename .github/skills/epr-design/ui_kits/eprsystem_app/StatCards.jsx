// StatCards.jsx — EPR System dashboard top row
// Four stat tiles in a responsive grid. Drop into the dashboard outlet.

import React from 'react';
import { Badge } from './Primitives';

export function StatCards({ stats }) {
  const data = stats ?? defaultStats;
  return (
    <div
      role="list"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
      }}
    >
      {data.map((s) => <StatCard key={s.id} {...s} />)}
    </div>
  );
}

function StatCard({ label, value, delta, deltaDirection = 'up', icon, accent = 'primary' }) {
  const accentColor = {
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger:  'var(--color-danger)',
    info:    'var(--color-info)',
  }[accent];

  const accentLight = {
    primary: 'var(--color-primary-light)',
    success: 'var(--color-success-light)',
    warning: 'var(--color-warning-light)',
    danger:  'var(--color-danger-light)',
    info:    'var(--color-info-light)',
  }[accent];

  return (
    <article
      role="listitem"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
      }}>
        <span style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          fontWeight: 'var(--fw-medium)',
        }}>
          {label}
        </span>
        <span aria-hidden="true" style={{
          width: 32, height: 32,
          borderRadius: 'var(--radius-md)',
          background: accentLight,
          color: accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
        }}>
          {icon}
        </span>
      </header>

      <div style={{
        fontSize: 'var(--text-3xl)',
        fontWeight: 'var(--fw-bold)',
        color: 'var(--color-text)',
        lineHeight: 1.1,
        fontFamily: 'var(--font-mono)',
      }}>
        {value}
      </div>

      {delta != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Badge variant={deltaDirection === 'up' ? 'success' : 'danger'} size="sm">
            {deltaDirection === 'up' ? '▲' : '▼'} {delta}
          </Badge>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            vs. last week
          </span>
        </div>
      )}
    </article>
  );
}

const defaultStats = [
  { id: 'students',   label: 'Total Students',     value: '248', delta: '+12',  deltaDirection: 'up',   icon: '👨‍🎓', accent: 'primary' },
  { id: 'attendance', label: 'Attendance Today',   value: '94%', delta: '+2%',  deltaDirection: 'up',   icon: '✅', accent: 'success' },
  { id: 'fees',       label: 'Fees Outstanding',   value: 'PKR 142K', delta: '-8%', deltaDirection: 'down', icon: '💰', accent: 'warning' },
  { id: 'classes',    label: 'Active Classes',     value: '18',  icon: '🏫', accent: 'info' },
];
