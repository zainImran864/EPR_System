// Shell.jsx — EPR System app shell
// Sidebar (240px) + topbar (56px) + content outlet.
// Drop this around your routed pages.

import React, { useState } from 'react';
import { Avatar, Badge } from './Primitives';

const navSections = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard',  label: 'Dashboard',  icon: '🏠' },
      { id: 'students',   label: 'Students',   icon: '👨‍🎓', count: 248 },
      { id: 'classes',    label: 'Classes',    icon: '🏫' },
      { id: 'attendance', label: 'Attendance', icon: '✅' },
      { id: 'marks',      label: 'Marks',      icon: '📝' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'fees',    label: 'Fees',    icon: '💰', count: 12 },
      { id: 'reports', label: 'Reports', icon: '📊' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { id: 'school',   label: 'School Settings',   icon: '⚙️' },
      { id: 'branding', label: 'Branding & Theme', icon: '🎨' },
    ],
  },
];

export function Shell({ active = 'dashboard', user = { name: 'Mr. Tariq', role: 'Admin' }, children, onNavigate }) {
  const [search, setSearch] = useState('');

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--color-bg)',
    }}>
      {/* ─── Sidebar ─── */}
      <aside style={{
        background: 'var(--color-sidebar-bg)',
        color: 'var(--color-sidebar-text)',
        width: 240,
        padding: 'var(--space-5) 0',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 'var(--text-sm)',
        flexShrink: 0,
      }}>
        <SidebarLogo />
        {navSections.map((section) => (
          <React.Fragment key={section.label}>
            <SectionLabel>{section.label}</SectionLabel>
            {section.items.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                active={item.id === active}
                onClick={() => onNavigate?.(item.id)}
              />
            ))}
          </React.Fragment>
        ))}
        <SidebarFooter user={user} />
      </aside>

      {/* ─── Main column ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          height: 56,
          padding: '0 var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <SearchInput value={search} onChange={setSearch} />
          <TopbarActions user={user} />
        </header>

        {/* Content outlet */}
        <main style={{ flex: 1, padding: 'var(--space-6)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

/* ────── sub-components ────── */

function SidebarLogo() {
  return (
    <div style={{
      padding: '0 var(--space-5) var(--space-5)',
      borderBottom: '1px solid #1E293B',
      marginBottom: 'var(--space-3)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      color: '#fff',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--text-base)',
    }}>
      <div style={{
        width: 32, height: 32,
        background: 'var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 'var(--fw-bold)',
      }}>S</div>
      School ERP
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      padding: 'var(--space-4) var(--space-5) var(--space-1)',
      fontSize: 10,
      fontWeight: 'var(--fw-semibold)',
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      color: 'var(--color-sidebar-icon)',
    }}>
      {children}
    </div>
  );
}

function NavItem({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: '9px var(--space-5)',
        background: active ? 'var(--color-primary)' : 'transparent',
        color: active ? '#fff' : 'var(--color-sidebar-text)',
        border: 'none',
        cursor: 'pointer',
        fontSize: 'var(--text-sm)',
        textAlign: 'left',
        fontFamily: 'inherit',
        transition: 'background var(--transition), color var(--transition)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--color-sidebar-hover)';
          e.currentTarget.style.color = '#fff';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--color-sidebar-text)';
        }
      }}
    >
      <span aria-hidden="true" style={{ width: 18, textAlign: 'center', fontSize: 16 }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.count != null && (
        <span style={{
          background: active ? 'rgba(255,255,255,.15)' : 'var(--color-primary-light)',
          color: active ? '#fff' : 'var(--color-primary-700)',
          fontSize: 10,
          fontWeight: 'var(--fw-bold)',
          padding: '2px 7px',
          borderRadius: 'var(--radius-full)',
        }}>
          {item.count}
        </span>
      )}
    </button>
  );
}

function SidebarFooter({ user }) {
  return (
    <div style={{
      marginTop: 'auto',
      padding: 'var(--space-4) var(--space-5)',
      borderTop: '1px solid #1E293B',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
    }}>
      <Avatar name={user.name} size="sm" />
      <div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: '#fff' }}>
          {user.name}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sidebar-icon)' }}>
          {user.role}
        </div>
      </div>
    </div>
  );
}

function SearchInput({ value, onChange }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-full)',
      padding: '7px 14px',
      fontSize: 'var(--text-sm)',
      color: 'var(--color-text-muted)',
      width: 260,
    }}>
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search students, classes…"
        aria-label="Search"
        style={{
          flex: 1,
          border: 'none',
          background: 'transparent',
          outline: 'none',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text)',
        }}
      />
    </label>
  );
}

function TopbarActions({ user }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <IconButton label="Notifications" hasUnread>🔔</IconButton>
      <IconButton label="Help">❓</IconButton>
      <Avatar name={user.name} size="sm" />
    </div>
  );
}

function IconButton({ children, label, hasUnread, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        position: 'relative',
        width: 36, height: 36,
        borderRadius: 'var(--radius-md)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 18,
        color: 'var(--color-text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background var(--transition)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
    >
      {children}
      {hasUnread && (
        <span aria-hidden="true" style={{
          position: 'absolute',
          top: 6, right: 6,
          width: 8, height: 8,
          borderRadius: '50%',
          background: 'var(--color-danger)',
          border: '2px solid var(--color-surface)',
        }}/>
      )}
    </button>
  );
}
