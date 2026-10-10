The single-select card inside forms — one style app-wide, legislated from CreateWizard's template/anonymity pickers and FillWizard's role picker and rating scale, and extracted as `components/OptionCard.tsx` so the selected-state logic exists exactly once.

## Variants

- **Tile** (anonymity, role) — `surface-2` ground, hover deepens to `surface-3`, selected swaps to the `accent-weak` tint + a 20px gold check disc top-right (`accent` fill, `text-inverse` check, inset 8). `radius-lg`, padding 12.
- **Rich tile** (template picker) — same as Tile but `radius-xl`, padding 16; holds a 44px icon + title + description + expandable preview.
- **Scale** (rating 1–5) — five equal columns (emoji + number), cells `radius-lg`, block padding 12, gap 8; selected = `accent-weak` tint + 16px check disc (inset 4), label back to normal ink; unselected `surface-2` + `text-muted`.

## Behavior

Single select (radio semantics): click selects, clicking another cell moves the selection, re-clicking does not deselect. Selection is always expressed by surface change — fill swap + a mark, never a border. The check disc is a mark, not a button; it does not count against one-gold-per-view. Keyboard reachable: native button with a visible focus-ring; the template card renders as div role="button" (it contains an inner expand button), with Enter/Space acting as click.

## Ruling log

2026-10-10 (OptionCard ticket): the rating scale's selected style was unified from "solid gold cell + dark label" to tint + check — a direct application of the `accent-weak` clause "selected chips"; the solid school had no legal basis and is repealed. The same ticket added the hovers missing from the template and role cards.
