// Primitives.jsx — EPR System UI kit
// The smallest reusable atoms. Every higher-level screen composes from these.
// All visual values come from CSS custom properties in colors_and_type.css.

import React from 'react';

/* ────────────────────────────── Button ────────────────────────────── */

const buttonBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 'var(--fw-medium)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid transparent',
  cursor: 'pointer',
  transition: 'background var(--transition), border-color var(--transition), color var(--transition)',
  whiteSpace: 'nowrap',
};

const buttonSizes = {
  sm: { padding: '6px 12px', fontSize: 'var(--text-sm)' },
  md: { padding: '9px 16px', fontSize: 'var(--text-base)' },
  lg: { padding: '11px 20px', fontSize: 'var(--text-md)' },
};

const buttonVariants = {
  primary: {
    background: 'var(--color-primary)',
    color: 'var(--color-primary-text)',
  },
  secondary: {
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    borderColor: 'var(--color-border-strong)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
  },
  danger: {
    background: 'var(--color-danger)',
    color: '#fff',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  children,
  ...rest
}) {
  const style = {
    ...buttonBase,
    ...buttonSizes[size],
    ...buttonVariants[variant],
    opacity: disabled || loading ? 0.6 : 1,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
  };
  return (
    <button style={style} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner size={size === 'sm' ? 12 : 14} /> : icon}
      {children}
    </button>
  );
}

/* ────────────────────────────── Badge ────────────────────────────── */

const badgeVariants = {
  primary: { background: 'var(--color-primary-light)', color: 'var(--color-primary-700)' },
  success: { background: 'var(--color-success-light)', color: 'var(--color-success-text)' },
  warning: { background: 'var(--color-warning-light)', color: 'var(--color-warning-text)' },
  danger:  { background: 'var(--color-danger-light)',  color: 'var(--color-danger-text)' },
  info:    { background: 'var(--color-info-light)',    color: 'var(--color-info-text)' },
  neutral: { background: '#F1F5F9',                    color: 'var(--color-text-secondary)' },
};

export function Badge({ variant = 'neutral', dot = false, size = 'md', children }) {
  const sizes = {
    sm: { fontSize: '10px', padding: '1px 6px' },
    md: { fontSize: 'var(--text-xs)', padding: '2px 8px' },
    lg: { fontSize: 'var(--text-sm)', padding: '4px 12px' },
  };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      borderRadius: 'var(--radius-full)',
      fontWeight: 'var(--fw-medium)',
      ...sizes[size],
      ...badgeVariants[variant],
    }}>
      {dot && <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: 'currentColor', flexShrink: 0,
      }} />}
      {children}
    </span>
  );
}

/* ────────────────────────────── Input ────────────────────────────── */

export function Input({ label, hint, error, id, ...rest }) {
  const inputId = id || `input-${React.useId()}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {label && (
        <label htmlFor={inputId} style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--fw-medium)',
          color: 'var(--color-text)',
        }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={hint || error ? `${inputId}-msg` : undefined}
        style={{
          width: '100%',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-base)',
          color: 'var(--color-text)',
          background: 'var(--color-surface)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border-strong)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          outline: 'none',
          transition: 'border-color var(--transition), box-shadow var(--transition)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgb(13 148 136 / 12%)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border-strong)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...rest}
      />
      {(hint || error) && (
        <span id={`${inputId}-msg`} style={{
          fontSize: 'var(--text-xs)',
          color: error ? 'var(--color-danger-text)' : 'var(--color-text-muted)',
        }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}

/* ────────────────────────────── Avatar ────────────────────────────── */

const avatarSizes = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 };
const avatarPalette = [
  { bg: '#FEE2E2', fg: '#B91C1C' },
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#DCFCE7', fg: '#15803D' },
  { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: '#E0E7FF', fg: '#4338CA' },
  { bg: '#FCE7F3', fg: '#9D174D' },
  { bg: 'var(--color-primary-light)', fg: 'var(--color-primary-700)' },
];

function pickColor(name) {
  const seed = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return avatarPalette[seed % avatarPalette.length];
}

export function Avatar({ name = '?', size = 'md', src }) {
  const px = avatarSizes[size];
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const { bg, fg } = pickColor(name);
  return (
    <div
      role="img"
      aria-label={name}
      style={{
        width: px, height: px,
        borderRadius: 'var(--radius-full)',
        background: src ? `center/cover url(${src}) ${bg}` : bg,
        color: fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: px * 0.4,
        fontWeight: 'var(--fw-semibold)',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {!src && initials}
    </div>
  );
}

/* ────────────────────────────── Spinner ────────────────────────────── */

export function Spinner({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
         style={{ animation: 'epr-spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeLinecap="round"
              strokeDasharray="40 60" />
      <style>{`@keyframes epr-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
