---
name: epr-design
description: ERP Design System Enforcement & Migration for the School ERP. Use this skill when reviewing or migrating frontend code to align with the design system in design-guidelines/ — checking that components use design tokens, follow documented patterns, and have all required states (loading/empty/error). Also use when porting legacy UI to the token system.
---

# EPR-Design — ERP Design System Enforcement & Migration

This skill enforces the School ERP design system contract and provides recipes for migrating legacy UI code to the token system.

## What this skill is for

Two related jobs:

1. **Enforcement** — audit a component, page, or PR against the design system. Catch token drift (hardcoded hex, off-scale spacing), missing states, accessibility gaps, and pattern divergence.

2. **Migration** — port pre-design-system code (raw hex, arbitrary spacing, ad-hoc components) to the documented tokens and patterns without changing behaviour.

## Source of truth

- [design-guidelines/components/base.css](../../../design-guidelines/components/base.css) — every token, every component class
- [design-guidelines/components/](../../../design-guidelines/components/) — canonical examples of each component
- [design-guidelines/foundations/](../../../design-guidelines/foundations/) — token rationale and rules
- [design-guidelines/README.md](../../../design-guidelines/README.md) — system overview

## How to invoke

Two reference files live alongside this skill:

- **[audit-checklist.md](audit-checklist.md)** — the step-by-step checklist to run when auditing code. Use this for enforcement work.
- **[migration-recipes.md](migration-recipes.md)** — concrete before/after patterns for porting legacy code. Use this for migration work.

When this skill runs:

1. **Identify the job** — is the user asking for an audit (read-only, report findings) or a migration (edit code)?
2. **Load the relevant reference** — audit-checklist for audits, migration-recipes for migrations.
3. **Identify the files in scope** — the user names them, or you grep for the pattern (e.g. `#[0-9A-Fa-f]{3,6}` for raw hex, `padding:\s*\d+px` for arbitrary spacing).
4. **Walk the checklist or apply the recipe.** One file at a time.
5. **Report or commit** — audits return a punch list grouped by severity. Migrations leave a brief summary of what changed and which tokens replaced what.

## Non-negotiables (always, regardless of job)

- All colour values: `var(--color-*)`
- All spacing: `var(--space-*)` (4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48)
- All radius: `var(--radius-*)` (4 / 8 / 12 / 16 / 9999)
- All shadows: `var(--shadow-*)` (sm / md / lg / xl)
- All font-size: `var(--text-*)` (11 / 13 / 14 / 15 / 18 / 20 / 24 / 30)
- All transitions: `var(--transition)` for interaction, documented timings for structural
- Multi-tenant safe: NO hardcoded brand colours — schools override `--color-primary-*` at runtime

## When NOT to use this skill

- Building a brand-new component from scratch — use `frontend-developer` instead, it has the full system context.
- Architectural questions ("should this be a shared component?") — use `tech-lead` or `architecture-planner`.
- Code that doesn't render UI (controllers, services, utilities) — out of scope.

## Outcome

A component is "epr-clean" when:
- Every value that has a token uses the token
- Every documented state (loading/empty/error/data) is implemented
- Every interactive element passes basic a11y (label, focus, semantics)
- The component is themeable — overriding `--color-primary-*` in `:root` updates it correctly
