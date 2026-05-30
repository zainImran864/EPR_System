# EPR-Design Audit Checklist

Run this checklist against any UI file, component, or PR being reviewed for design system compliance.

Group findings by severity:
- **BLOCK** — must fix before merge
- **WARN** — smell, flag it
- **OK** — passes

---

## 1. Token Compliance — BLOCK on any failure

### 1.1 Colour
- [ ] No raw hex (`#0D9488`, `#fff`) in component code. Search regex: `#[0-9A-Fa-f]{3,8}\b`
- [ ] No raw `rgb(...)` / `rgba(...)` / `hsl(...)`. Search: `rgba?\(`
- [ ] All colour values use `var(--color-*)` from `base.css`
- [ ] No hardcoded brand colour — would break per-school theming

### 1.2 Spacing
- [ ] No arbitrary `padding` / `margin` / `gap` pixel values
- [ ] All spacing on the 4px scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48
- [ ] All spacing uses `var(--space-*)` tokens
- [ ] No `padding: 1rem` etc. — use the px-based token

### 1.3 Radius
- [ ] No arbitrary `border-radius` values
- [ ] Uses `var(--radius-sm|md|lg|xl|full)`

### 1.4 Shadow
- [ ] No inline `box-shadow` definitions
- [ ] Uses `var(--shadow-sm|md|lg|xl)`

### 1.5 Typography
- [ ] No raw `font-size` values; uses `var(--text-*)`
- [ ] No raw `font-weight` values; uses `var(--fw-*)`
- [ ] Body uses `var(--font-sans)`, code/IDs/amounts use `var(--font-mono)`

### 1.6 Transitions
- [ ] Interaction transitions use `var(--transition)` (150ms ease)
- [ ] Structural animations use one of the documented timings (220ms ease-out for enter, 150ms ease-in for exit)
- [ ] No `transition: all` — properties are enumerated

---

## 2. Component Pattern — WARN

- [ ] If the component visually matches a documented one in `design-guidelines/components/`, it uses the documented pattern
- [ ] New variants are added as classes in `base.css`, not as inline styles or one-off CSS modules
- [ ] Component composes with existing primitives (buttons, badges, form controls) — not parallel re-implementations

---

## 3. States — BLOCK on data views

For any list, table, or data-fetch view:

- [ ] **Loading state** — spinner or skeleton, not a blank screen
- [ ] **Empty state** — uses the documented empty-state pattern: icon + title + description + primary action
- [ ] **Error state** — alert or empty-state-error pattern with a retry action
- [ ] **Disabled state** on every interactive control that can be disabled

For forms:

- [ ] **Validation error** state shown inline, using `--color-danger`
- [ ] **Submitting** state on the submit button (spinner + disabled)
- [ ] **Success** feedback after a successful submit (toast or inline)

---

## 4. Accessibility

### 4.1 BLOCK
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have associated `<label>` (htmlFor / id), not just placeholders
- [ ] Headings descend in order (no h2 → h4 skips)
- [ ] Focus is visible — no `outline: none` without a replacement
- [ ] Colour is never the sole indicator (badges have text or icons, not just colour)
- [ ] `<button>` for actions, `<a>` for navigation — not divs with onClick

### 4.2 WARN
- [ ] Decorative icons beside text labels are `aria-hidden="true"`
- [ ] Interactive elements are reachable by keyboard (tab order makes sense)
- [ ] Modals and offcanvas trap focus and restore on close
- [ ] Live regions for toast notifications

---

## 5. Responsive — WARN

- [ ] Layout works at 480px wide
- [ ] Stat grids: 4 col (lg+) → 2 col (md) → 1 col (xs/sm)
- [ ] Tables get horizontal scroll on narrow widths
- [ ] Sidebar: expanded ≥1024px, icon-only 768–1023px, hidden below 768px
- [ ] No horizontal page scroll at any breakpoint

---

## 6. Multi-tenant Theming — BLOCK

- [ ] Component renders correctly when `--color-primary-*` is overridden at `:root` (test: temporarily change the variable in dev tools, confirm the component picks it up)
- [ ] No fallback hex baked in
- [ ] Logo / brand mark fetched from the school's branding config, not hardcoded

---

## Output Format

```
File: src/components/StudentCard.tsx

BLOCK
  L24 — raw hex `#0D9488` for badge background
        → replace with `var(--color-primary)`
  L41 — missing aria-label on icon-only edit button
  L52 — no empty state for the marks list

WARN
  L18 — `padding: 22px` not on the scale
        → closest token: `var(--space-5)` (20px) or `var(--space-6)` (24px)
  L67 — could reuse `<Badge variant="success">` from base.css

OK
  - All radii use tokens
  - All transitions use --transition
  - Form labels are properly associated

Verdict: Needs 3 fixes before merge.
```

End every audit with the one-line verdict.
