The AI report layout is the product's signature pattern: a quoted one-line summary, then the semantic pair — a green box for what's going well, a red box for what to improve — then gold-arrow next steps. Hand-written from `components/ReportPanel.tsx`.

## Anatomy

- **Summary quote** in the `body-lg` style (17px/500, reserved for the quote), wrapped in oversized `accent`-colored quotation marks set in the display face; a `border` hairline closes the section.
- **The pair**: two `radius-xl` boxes on `green-weak` and `danger-weak` — the palette's semantic tokens carrying the data's meaning directly. Green bullets are 8px `green-500` dots; red bullets are `red-500` warning triangles. Titles in label-lg style.
- **Bullets** end with round source tags (see Badge) linking each claim to its origin answer.
- **Collapse**: lists longer than four items fold behind a centered "Show N more" text button in `text-muted` with a chevron that flips when open — a long red column must not dominate the layout.
- **Next steps** run full-width below with `gold-700` arrows.

Empty states say "Nothing specific this time." in `text-subtle` — never an apology, never a hidden section.
