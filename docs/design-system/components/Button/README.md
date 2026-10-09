Buttons are borderless filled rectangles: gold for the one primary action, a neutral fill for everything else, red only for destruction. Hand-written from `app/globals.css` (`.btn*`).

## Variants

- **Primary** — `accent` fill, `text-inverse` (dark brown) label. One per view. Hover *brightens* to `accent-hover`; active goes `accent-press` and the whole button dips to scale(0.97).
- **Ghost** — `surface-2` fill, `text` label; hover deepens to `surface-3`. The default for secondary actions; there is no outlined button in this system.
- **Text** — no fill, a `gold-700` readable-gold label; hover tints `accent-weak` (small-area legal). The secondary call when the view's gold is taken — **the designated style for AI-generate actions** (sparkles icon + label).
- **Danger** — `red-500` fill, for delete/close-session confirmations only.

## Specs

Height 36px (landing hero CTA exception: 48px tall with a 16px label — the only 16px in the system), padding-inline `space-4`, `radius-md`, label in the `button` style (600, −0.01em), icon 14–15px with a `space-2` gap. Disabled: 45% opacity, no color shift. The consumer provides the label and click handler; loading states swap the label, they never spin inside the button.
