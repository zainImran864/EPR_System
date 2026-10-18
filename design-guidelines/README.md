# School ERP — Design System

Live HTML design system for the School ERP SaaS platform. Open any `.html` file directly in a browser — no build step required.

## Entry Point

Open [`index.html`](index.html) for the full single-page overview with all components and tokens rendered inline.

## Structure

```
design-guidelines/
├── index.html                  # Full single-page design system
├── components/
│   ├── base.css                # All CSS — tokens + every component class
│   ├── alerts.html
│   ├── avatars.html
│   ├── badges.html
│   ├── breadcrumb.html
│   ├── buttons.html
│   ├── cards.html
│   ├── dropdowns.html
│   ├── empty-states.html
│   ├── forms.html
│   ├── modals.html
│   ├── offcanvas.html
│   ├── pagination.html
│   ├── progress.html
│   ├── sidebar.html
│   ├── spinners.html
│   ├── steps.html
│   ├── switches.html
│   ├── tables.html
│   ├── tabs.html
│   ├── toasts.html
│   └── topbar.html
└── foundations/
    ├── colors.html
    ├── typography.html
    ├── spacing.html
    ├── border-radius.html
    ├── shadows.html
    ├── transitions.html
    ├── breakpoints.html
    └── icons.html
```

## Foundations

| File | What it covers |
|------|---------------|
| [colors.html](foundations/colors.html) | Teal primary ramp (50–900), semantic tokens (success/warning/danger/info), neutral Slate scale, sidebar tokens, live multi-tenant theming override pattern |
| [typography.html](foundations/typography.html) | Plus Jakarta Sans & Inter UI stack, JetBrains Mono / Fira Code (`tabular-nums`) for IDs/amounts, full type scale (11px–30px), `text-wrap: balance` |
| [spacing.html](foundations/spacing.html) | 4px base unit, space-1 through space-12, visual demos, usage rules |
| [border-radius.html](foundations/border-radius.html) | sm (4px) through 2xl (20px) and full (pill), applied to buttons/cards/badges/avatars |
| [shadows.html](foundations/shadows.html) | Layered elevation levels (`sm`/`md`/`lg`/`xl`/`card`/`card-hover`), focus rings (`--ring-primary`) |
| [transitions.html](foundations/transitions.html) | Default `150ms ease` token, structural animation timings (`--transition-enter`), rules for `prefers-reduced-motion` |
| [breakpoints.html](foundations/breakpoints.html) | xs/sm/md/lg/xl scale, responsive sidebar drawer & collapse behaviour, grid columns per breakpoint |
| [icons.html](foundations/icons.html) | Inline SVG pattern, size scale, core 24-icon set, Lucide Icons recommendation |

## Components & Composite Patterns

| File | What it covers |
|------|---------------|
| [buttons.html](components/buttons.html) | 6 variants, 4 sizes, states (disabled/loading), icon buttons, full-width |
| [badges.html](components/badges.html) | 7 variants, dot indicators, 3 sizes, attendance/fee/grade use cases |
| [forms.html](components/forms.html) | Text inputs, clearable search, select, textarea, input addons, full Add Student example |
| [switches.html](components/switches.html) | Toggle switches, checkboxes (standalone/select-all), radio buttons |
| [cards.html](components/cards.html) | Enhanced Stat cards with trends & progress bars, content cards, accent/highlighted cards |
| [tables.html](components/tables.html) | Student table, attendance week view, marks table, filter toolbar with active chips |
| [alerts.html](components/alerts.html) | 4 variants, with title/action, dismissible |
| [toasts.html](components/toasts.html) | 4 variants, with action, position/stack demo, timing rules |
| [modals.html](components/modals.html) | Add Student form, destructive confirmation, info/view modal, size spec |
| [offcanvas.html](components/offcanvas.html) | Filter drawer, quick-edit drawer |
| [dropdowns.html](components/dropdowns.html) | Row actions, filter menu, user menu with profile header |
| [tabs.html](components/tabs.html) | Underline tabs, pill tabs, status filter pills |
| [pagination.html](components/pagination.html) | First/middle/last states, with page-size selector, minimal prev/next |
| [progress.html](components/progress.html) | 5 colour variants, 5 sizes, attendance/fee breakdown use cases |
| [spinners.html](components/spinners.html) | 4 sizes, 5 colours, in buttons, full panel overlay |
| [avatars.html](components/avatars.html) | 5 sizes, 8 colour variants, avatar groups, list pattern with badge |
| [breadcrumb.html](components/breadcrumb.html) | Slash/chevron/home-icon separators, in page layout context |
| [steps.html](components/steps.html) | All 4 progression states, wizard in a card with form + back/next nav |
| [empty-states.html](components/empty-states.html) | First-time, no results, error, inside table, ERP-specific (attendance/fees/reports) |
| [sidebar.html](components/sidebar.html) | Grouped school portal sidebar (`Overview`, `Academics`, `Operations`, `System`), active pill & mobile drawer |
| [topbar.html](components/topbar.html) | Default topbar, Command Palette (`⌘K`) trigger, breadcrumb context, notification panel |

## Live Multi-Tenant & Per-User Theming

All colours are CSS custom properties in `base.css` (and `apps/school-erp/app/globals.css`). Opening [`index.html`](index.html) includes a sticky **Live Multi-Tenant Theme Switcher** bar with 8 built-in presets (*Teal*, *Royal Blue*, *Indigo*, *Emerald*, *Violet*, *Amber*, *Crimson*, *Slate*).

To apply a school's brand colour or user theme at runtime, override the primary ramp at the `:root` level:

```css
:root {
  --color-primary-50:  #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-200: #BFDBFE;
  --color-primary-500: #3B82F6;
  --color-primary-600: #2563EB;   /* --color-primary */
  --color-primary-700: #1D4ED8;   /* --color-primary-hover */
  --color-primary-800: #1E40AF;
  --color-primary-900: #1E3A8A;
  --color-primary-light: #DBEAFE; /* badge/chip backgrounds */
}
```

No component file needs to change — every button, badge, input focus ring, hero banner, and active state picks up the override automatically.

## Design Tokens Quick Reference

| Category | Key tokens |
|----------|-----------|
| Brand | `--color-primary` (`#0D9488`), `--color-primary-hover`, `--color-primary-light`, `--gradient-brand` |
| Surfaces | `--color-bg` (`#F8FAFC`), `--color-surface` (`#FFF`), `--color-surface-subtle`, `--color-surface-hover`, `--color-border` |
| Text | `--color-text` (`#0F172A`), `--color-text-secondary`, `--color-text-muted` |
| Semantic | `--color-success/warning/danger/info` + `-light` + `-text` variants |
| Sidebar | `--color-sidebar-bg` (`#0F172A`), `--color-sidebar-text`, `--color-sidebar-hover`, `--color-sidebar-icon` |
| Spacing | `--space-1` (4px) → `--space-12` (48px) |
| Radius | `--radius-sm` (4px) → `--radius-2xl` (20px) → `--radius-full` (9999px) |
| Shadow & Ring | `--shadow-sm` → `--shadow-xl`, `--shadow-card`, `--shadow-card-hover`, `--ring-primary` |
| Type | `--text-xs` (11px) → `--text-3xl` (30px), `tabular-nums` for `.font-mono-data` |
| Weight | `--fw-normal/medium/semibold/bold` |
| Animation | `--transition` (`150ms ease`), `--transition-enter` (`220ms cubic-bezier(0.16, 1, 0.3, 1)`) |

