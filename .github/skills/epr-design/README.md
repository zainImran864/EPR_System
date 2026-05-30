# EPR-Design Kit

The canonical design reference for the **School ERP System**. Tokens, brand assets, and a working React UI kit (`eprsystem_app`) that together define how the product looks.

## What's inside

| Path | Purpose |
|------|---------|
| [SKILL.md](SKILL.md) | Skill manifest — when to invoke this bundle |
| [colors_and_type.css](colors_and_type.css) | All design tokens — drop-in `<link>` for any prototype |
| [assets/logo-mark.svg](assets/logo-mark.svg) | Square brand mark — sidebar, favicon, app icon |
| [assets/logo-lockup.svg](assets/logo-lockup.svg) | Horizontal lockup — login screen, marketing header |
| preview/ | Rendered PNG screenshots of each kit screen |
| [ui_kits/eprsystem_app/](ui_kits/eprsystem_app/) | Working React UI kit — every core screen |

## Brand

- **Name:** EPR System (School ERP)
- **Mark:** lowercase white `S` on a teal-600 rounded square
- **Primary:** `#0D9488` (teal-600)
- **Voice:** clear, neutral, school-administrator-friendly. Never marketing-fluffy in product surfaces.

## Tokens at a glance

```css
--color-primary: #0D9488;     /* teal-600 */
--color-bg:      #F8FAFC;     /* slate-50 */
--color-surface: #FFFFFF;
--color-text:    #0F172A;     /* slate-900 */

--space-1: 4px;  --space-2: 8px;  --space-3: 12px;
--space-4: 16px; --space-5: 20px; --space-6: 24px;

--radius-md: 8px;  --radius-lg: 12px;  --radius-full: 9999px;

--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--transition: 150ms ease;
```

Full set in [colors_and_type.css](colors_and_type.css).

## Per-school theming

The EPR system is multi-tenant. Each school can override the primary ramp at runtime:

```css
:root {
  --color-primary-500: #3B82F6;
  --color-primary-600: #2563EB;   /* school's brand colour */
  --color-primary-700: #1D4ED8;
  --color-primary-light: #DBEAFE;
}
```

No kit component should ever hardcode `#0D9488` — every brand-aware surface must read from `var(--color-primary-*)`.

## Using the React kit

```bash
# Drop the files into your app
cp ui_kits/eprsystem_app/*.jsx src/components/

# Link the tokens
<link rel="stylesheet" href="colors_and_type.css" />

# Compose
import { Shell } from './components/Shell';
import { StatCards } from './components/StatCards';
```

The kit is intentionally framework-light: function components, no state library, no CSS-in-JS. Tokens come from CSS variables.

## See also

- [`design-guidelines/`](../../../design-guidelines/) — the full HTML design system (every component documented)
- [`.claude/skills/epr-design/`](../../../.claude/skills/epr-design/) — audit checklist and migration recipes for enforcement work
- [`architecture.md`](../../../architecture.md) — where this UI sits in the four-app architecture
