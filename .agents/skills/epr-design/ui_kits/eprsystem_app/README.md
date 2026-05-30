# eprsystem_app — UI Kit

A working React reference kit for the **EPR System**. Every file is a self-contained component you can lift into the actual product.

## Files

| File | What it is |
|------|-----------|
| [index.html](index.html) | Static preview — opens every screen in a single page (no build) |
| [Shell.jsx](Shell.jsx) | Layout shell — sidebar + topbar + outlet, the chrome around every page |
| [Primitives.jsx](Primitives.jsx) | Button, Badge, Input, Avatar — the smallest reusable atoms |
| [StatCards.jsx](StatCards.jsx) | Dashboard top-row stat tiles (4 across) |
| [LoginScreen.jsx](LoginScreen.jsx) | Unauthenticated entry point — uses the lockup logo |
| [StudentFeed.jsx](StudentFeed.jsx) | Paginated student list with filters, search, row actions |
| [StudentDetail.jsx](StudentDetail.jsx) | Single-record view — profile header, tabbed sections, attendance/marks/fees |

## Previews

`../preview/` holds rendered PNGs of each screen. Regenerate with any screenshot tool — they are documentation only, not consumed by code.

## How to consume

```jsx
// 1. Link the tokens once at the app root
import '../../colors_and_type.css';

// 2. Wrap your routes with Shell
import { Shell } from './Shell';

// 3. Use primitives instead of raw <button>/<input>
import { Button, Badge, Input } from './Primitives';
```

## Rules

- No raw hex, no off-scale spacing, no inline shadows — every visual value reads from a CSS variable in `colors_and_type.css`.
- All four data states (loading / empty / error / data) are implemented in `StudentFeed.jsx` and `StudentDetail.jsx`. Use them as the template for every list/detail page you build.
- Icons are inline SVG, 24×24 viewBox, 2px stroke, `currentColor`. The kit uses the Lucide icon shape vocabulary — match it.
- Accessibility: every icon-only button has `aria-label`; every form input has a real `<label>`; focus rings are visible.

## What this kit is NOT

- It is not a published npm package. Copy the files; don't depend on the path.
- It is not state-management opinionated. Wire data in whatever pattern your app uses (React Query, RTK, plain fetch).
- It is not exhaustive. For components not shown here, see [`design-guidelines/components/`](../../../../design-guidelines/components/).
