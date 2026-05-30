# EPR-Design Migration Recipes

Concrete before/after patterns for porting legacy School ERP UI code to the design system. Apply these when migrating components, never freelance.

---

## Recipe 1: Raw hex → colour token

**Before:**
```css
.student-card { background: #0D9488; color: #ffffff; border: 1px solid #E2E8F0; }
.student-card-muted { color: #94A3B8; }
.student-card-error { background: #FEE2E2; color: #B91C1C; }
```

**After:**
```css
.student-card {
  background: var(--color-primary);
  color: var(--color-primary-text);
  border: 1px solid var(--color-border);
}
.student-card-muted { color: var(--color-text-muted); }
.student-card-error {
  background: var(--color-danger-light);
  color: var(--color-danger-text);
}
```

**Mapping cheat sheet:**

| Hex | Token |
|-----|-------|
| `#0D9488` | `var(--color-primary)` |
| `#0F766E` | `var(--color-primary-hover)` |
| `#CCFBF1` | `var(--color-primary-light)` |
| `#FFFFFF` | `var(--color-surface)` |
| `#F8FAFC` | `var(--color-bg)` |
| `#E2E8F0` | `var(--color-border)` |
| `#CBD5E1` | `var(--color-border-strong)` / `var(--color-text-disabled)` |
| `#0F172A` | `var(--color-text)` / `var(--color-sidebar-bg)` |
| `#475569` | `var(--color-text-secondary)` |
| `#94A3B8` | `var(--color-text-muted)` |
| `#16A34A` | `var(--color-success)` |
| `#DCFCE7` | `var(--color-success-light)` |
| `#15803D` | `var(--color-success-text)` |
| `#D97706` | `var(--color-warning)` |
| `#FEF3C7` | `var(--color-warning-light)` |
| `#DC2626` | `var(--color-danger)` |
| `#FEE2E2` | `var(--color-danger-light)` |
| `#0284C7` | `var(--color-info)` |

---

## Recipe 2: Arbitrary spacing → scale token

**Before:**
```css
.card { padding: 22px; margin-bottom: 18px; gap: 14px; }
.btn  { padding: 11px 17px; }
```

**After:**
```css
.card {
  padding: var(--space-5);          /* 20px — closest to 22 */
  margin-bottom: var(--space-5);    /* 20px — closest to 18 */
  gap: var(--space-3);              /* 12px — closest to 14 */
}
.btn { padding: var(--space-3) var(--space-4); }   /* 12px 16px */
```

**Snap rule:** round to the nearest token. When tied, pick the smaller one for dense layouts (tables, sidebars) and the larger for breathing-room layouts (cards, page content).

Allowed: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48. Anything else, snap.

---

## Recipe 3: Hardcoded radius → token

**Before:**
```css
.card { border-radius: 10px; }
.input { border-radius: 6px; }
.avatar { border-radius: 50%; }
.pill { border-radius: 99px; }
```

**After:**
```css
.card  { border-radius: var(--radius-lg); }    /* 12px */
.input { border-radius: var(--radius-md); }    /* 8px */
.avatar { border-radius: var(--radius-full); }
.pill  { border-radius: var(--radius-full); }
```

---

## Recipe 4: Inline shadow → token

**Before:**
```css
.modal { box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
.card  { box-shadow: 0 2px 4px rgba(0,0,0,0.06); }
```

**After:**
```css
.modal { box-shadow: var(--shadow-xl); }
.card  { box-shadow: var(--shadow-sm); }
```

**Elevation mapping:**

| Use | Token |
|-----|-------|
| Stat card, table row hover | `--shadow-sm` |
| Content card, popover | `--shadow-md` |
| Dropdown, tooltip, notification panel | `--shadow-lg` |
| Modal, offcanvas | `--shadow-xl` |

---

## Recipe 5: Custom font-size → type scale

**Before:**
```css
h1 { font-size: 28px; }
.label { font-size: 12px; }
.body  { font-size: 15px; line-height: 22px; }
```

**After:**
```css
h1     { font-size: var(--text-2xl); }     /* 24 — or --text-3xl (30) for hero */
.label { font-size: var(--text-xs); }      /* 11 */
.body  { font-size: var(--text-md); line-height: 1.5; }
```

Use unitless line-height (1.4, 1.5, 1.6), not px.

---

## Recipe 6: Ad-hoc badge → design system badge

**Before:**
```jsx
<span style={{
  background: '#DCFCE7',
  color: '#15803D',
  padding: '2px 8px',
  borderRadius: '99px',
  fontSize: '11px'
}}>Present</span>
```

**After:**
```jsx
<span className="badge badge-success badge-sm">Present</span>
```

The classes live in `design-guidelines/components/base.css`. If the component framework requires a wrapper, build it once and consume it everywhere.

---

## Recipe 7: Inline button → design system button

**Before:**
```jsx
<button style={{
  background: '#0D9488', color: 'white', padding: '9px 16px',
  border: 'none', borderRadius: '8px', fontWeight: 500
}}>Save</button>
```

**After:**
```jsx
<button className="btn btn-primary btn-md">Save</button>
```

---

## Recipe 8: Adding missing states

**Before:**
```jsx
function StudentList({ students }) {
  return <table>{students.map(s => <Row key={s.id} student={s} />)}</table>;
}
```

**After:**
```jsx
function StudentList({ students, isLoading, error, onRetry }) {
  if (isLoading) return <Spinner aria-label="Loading students" />;
  if (error)     return <ErrorState onRetry={onRetry} />;
  if (!students.length) return (
    <EmptyState
      icon="👨‍🎓"
      title="No students yet"
      description="Add your first student to start tracking attendance."
      action={<button className="btn btn-primary btn-md">Add Student</button>}
    />
  );
  return <table>{students.map(s => <Row key={s.id} student={s} />)}</table>;
}
```

Every data view ships with all four states from the start.

---

## Recipe 9: Inline transition → token

**Before:**
```css
.btn { transition: background 0.2s ease, transform 0.2s; }
.modal { transition: all 0.3s; }
```

**After:**
```css
.btn { transition: background var(--transition), transform var(--transition); }
.modal {
  transition: transform 220ms ease-out, opacity 220ms ease;  /* structural — documented timing */
}
```

Never `transition: all`. Enumerate the properties.

---

## Migration Workflow

1. **Find scope** — `grep` for raw hex / arbitrary spacing / inline shadows across the files in scope.
2. **One file at a time.** Don't fan out across the codebase in one pass.
3. **Apply the recipes above.** When unsure which token, pick the closest scale value.
4. **Verify visually** — pull up the page in the dev server, confirm nothing shifted.
5. **Test theming** — temporarily override `--color-primary-600` in dev tools, confirm the component re-themes.
6. **Run the audit checklist** ([audit-checklist.md](audit-checklist.md)) on the migrated file before declaring done.

## What you don't change during migration

- DOM structure unrelated to tokens
- Component public API (props, names)
- Behaviour — migrations are visual-only by default
- Tests — unless they assert on hex values that you replaced

If the migration tempts you to refactor logic, stop. Land the token migration first, refactor in a separate PR.
