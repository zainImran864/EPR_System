---
name: epr-design
description: School ERP System design kit. A self-contained reference bundle — colour and type tokens, brand assets, and a working React UI kit (eprsystem_app) showing the dashboard shell, primitives, login, and core data views. Use this skill when designing or building any EPR-system UI — it is the canonical visual reference.
---

# EPR-Design — School ERP System Design Kit

A bundled reference for the School ERP design system. Open `README.md` for the high-level tour, then drop into the relevant subfolder.

## Bundle layout

```
.agents/skills/epr-design/
├── SKILL.md                     ← you are here
├── README.md                    ← overview, theming, asset usage
├── colors_and_type.css          ← all tokens (colour, type, spacing, radius, shadow, transition)
├── assets/
│   ├── logo-mark.svg            ← square mark, 32×32 usage (sidebar logo)
│   └── logo-lockup.svg          ← mark + wordmark, marketing & login header
├── preview/                     ← rendered preview screenshots (PNG)
└── ui_kits/
    └── eprsystem_app/           ← working React UI kit
        ├── README.md            ← how to run / consume the kit
        ├── index.html           ← static preview index linking every screen
        ├── Shell.jsx            ← sidebar + topbar layout shell
        ├── Primitives.jsx       ← Button / Badge / Input / Avatar
        ├── StatCards.jsx        ← dashboard stat row
        ├── LoginScreen.jsx      ← auth landing
        ├── StudentFeed.jsx      ← list/table view of students
        └── StudentDetail.jsx    ← single-record detail page
```

## When to use this skill

- Designing or building any UI inside the School ERP — drop a primitive from `Primitives.jsx`, reuse the shell from `Shell.jsx`, copy a table pattern from `StudentFeed.jsx`.
- Onboarding a new contributor to the visual language — point them at `README.md` and `ui_kits/eprsystem_app/index.html`.
- Bidding a new theme for a school — override the `:root` variables in `colors_and_type.css` and confirm the kit still looks right.

## When NOT to use this skill

- For backend or schema work — that's not what this bundle covers.
- For component-level audit / migration of existing legacy code — that lives in [`.claude/skills/epr-design/`](../../../.claude/skills/epr-design/) (audit-checklist, migration-recipes). This bundle is a *reference*; that one is *enforcement*.

## How to invoke

1. Read `README.md` for the tour.
2. Open `ui_kits/eprsystem_app/index.html` in a browser to see every screen rendered.
3. Lift the React component closest to what you're building.
4. Theme it by overriding the tokens in `colors_and_type.css` — never hardcode.
