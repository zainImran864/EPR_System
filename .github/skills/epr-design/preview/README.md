# EPR-Design — Preview Index

A flat catalogue of single-purpose preview pages. Each file demonstrates one element or pattern in isolation, using the EPR design tokens via [`../colors_and_type.css`](../colors_and_type.css) and the shared layout in [`_preview.css`](_preview.css).

Open any file directly in a browser — no build step required.

## Brand

| Preview | Topic |
|---------|-------|
| [logo.html](logo.html) | Mark, lockup, sizing, clear space |

## Colour

| Preview | Topic |
|---------|-------|
| [colors-accent.html](colors-accent.html) | Primary teal ramp + theming |
| [colors-severity.html](colors-severity.html) | Success / warning / danger / info |
| [colors-surfaces.html](colors-surfaces.html) | Backgrounds, borders, sidebar palette |
| [colors-text.html](colors-text.html) | Text hierarchy — on light and dark |

## Type

| Preview | Topic |
|---------|-------|
| [type-display.html](type-display.html) | Headings + display numerals |
| [type-body-mono.html](type-body-mono.html) | Body scale + JetBrains Mono |

## Foundations

| Preview | Topic |
|---------|-------|
| [spacing-scale.html](spacing-scale.html) | 4px base scale + gap demos |
| [radius-scale.html](radius-scale.html) | Five radius levels in context |
| [shadows.html](shadows.html) | Four elevation levels |
| [icons.html](icons.html) | Sizes, core set, SVG pattern |

## Components

| Preview | Topic |
|---------|-------|
| [buttons.html](buttons.html) | Six variants, three sizes, states |
| [badges-tags.html](badges-tags.html) | Status badges + removable tags |
| [inputs.html](inputs.html) | Inputs, selects, textarea, input groups |
| [cards.html](cards.html) | Stat cards, content cards, accent cards |
| [tables.html](tables.html) | Toolbar + table + paginated footer |
| [tabs.html](tabs.html) | Underline tabs + pill tabs |
| [toasts.html](toasts.html) | Four severities, timing rules |
| [dialog-modal.html](dialog-modal.html) | Form, confirm, info modals |
| [tooltip-popover.html](tooltip-popover.html) | Tooltip vs. popover |
| [search-palette.html](search-palette.html) | ⌘K command palette |

## Files

- [`_preview.css`](_preview.css) — shared layout for every preview page (header, sections, canvas, table styles)
- Every `.html` file links both `../colors_and_type.css` and `_preview.css`

## Rules for new previews

When adding a preview:

1. Link `../colors_and_type.css` first, then `_preview.css`.
2. Wrap content in `<section class="preview-section">` with an `<h2>` per topic.
3. Use the `.canvas`, `.canvas.row`, `.canvas.col`, `.canvas.grid-3/4`, and `.canvas.dark` utilities — don't invent new layout classes.
4. Every value (colour / spacing / radius / shadow / font-size) reads from a CSS variable. **Never hardcode hex or arbitrary px.**
5. End with a "Usage" or "Rules" table summarising when/how to apply the pattern.
