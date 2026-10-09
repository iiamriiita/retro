# Team Retro — agent guide

Next.js 15 (App Router) + TypeScript + Tailwind + Supabase (Postgres/RLS/Auth) + Google Gemini. Deployed on Vercel.

## Design system — read before any UI work

The design system is the contract for all UI work in this repo. It lives in
two synchronized forms: **`docs/design-system/`** (the canonical file-per-file
sources — tokens.json, README.md, motion.md, components/*/README.md) and
**`docs/design-system.md`** (the same content packed into one file for quick
reading). Read either; edit through the workflow below, never just one copy.
The hard rules:

- All colors, radii, fonts and shadows MUST come from the tokens in `app/globals.css` `:root`. Never hardcode a hex value — propose a new token first.
- Gold (`--accent`) is the only interactive color. **One primary button per view (a modal counts as its own view).** Hover brightens (`--accent-hover`), never darkens. There are no outlined buttons — secondary actions use the ghost style.
- Green/red are semantic only: green always means *going well*, red always means *needs improvement*.
- Cards are flat: no borders, no shadows, never nested. Elevation (shadow) is reserved for menus and modals (one exception: the flat card-style confirm dialog — see the Modal spec).
- Alpha tints (`--accent-weak` etc.) are for small areas only; large fills use solid colors.
- Illustrations and icons are inline SVG colored with tokens only. No PNG art assets (the wordmark is the single exception).
- Motion: animate transform/opacity only, follow the duration scale in `docs/design-system.md`, and keep everything behind `prefers-reduced-motion`.
- Every user-facing string ships in English and Traditional Chinese (zh-TW) together — see `lib/i18n`.

Reuse before creating: import from `components/*`, style with the classes in `app/globals.css` (`.card`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.badge`, `.textarea`…). Carve a new component only when nothing existing fits — and when you do, it joins the library and `docs/design-system.md` should be updated to match.

## Executing UI work

Every UI task — a page, a component, a visual change, a micro-interaction —
follows **`docs/agent-design-flow.md`**: a written design plan with a
mandatory state inventory (incl. empty/loading/error) → owner confirms →
reuse ladder (import → class → compose from tokens → bridge to the update
workflow when vocabulary is missing) → build under the six constraints →
machine-checkable self-audit → owner reviews the key screens → a three-line
delivery summary.

## Changing the design system itself

Any change to tokens, principles, motion rules or component specs follows
**`docs/design-system-workflow.md`**: a structured change ticket, two owner
confirmations (the ticket, then the impact list) before any file is touched,
then strictly sources → product → projections. If existing components or rules
don't fit the task at hand, propose a change through that workflow — never
work around the system silently.
