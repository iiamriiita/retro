# Team Retro

**Honest team feedback, minus the awkward.** Team Retro is a retrospective tool for 2–5-person teams: one link collects anonymous answers, and AI sorts them into highlights, improvements and next steps. The design system exists to make a potentially tense ritual feel **warm, calm and safe** — and, because the product was built in an AI pair-programming loop, to act as the **guardrail that kept dozens of AI-built iterations visually coherent**.

The visual identity in one line: *warm paper, one gold, flat surfaces, brown ink.*

## Principles

1. **Flat first.** Cards have no border and no shadow; hierarchy comes from surface steps (`bg` → `surface` → `surface-2` → `surface-3`). Elevation is reserved for things that truly float — menus and modals get `shadow-md`/`shadow-lg`, nothing else does. If a design needs a card to "pop", the answer is a surface step or spacing, never a new shadow.
2. **One accent, fully specified.** Gold `accent` is the only interactive hue, and it ships with every state it needs: `accent-hover` (lighter — buttons brighten, they don't darken), `accent-press`, `accent-weak` (16% tint), and `gold-700` for text-sized gold on light grounds where raw `accent` would fail contrast. Because interaction owns gold exclusively, "can I click this?" is answered by color alone.
3. **Semantic color is not decoration.** Green and red are meanings, not moods: `green-500`/`green-weak` always say *going well*, `red-500`/`danger-weak` always say *needs improvement*. The AI report's two boxes are these tokens verbatim — the data model and the palette share one vocabulary.
4. **Warm everything.** There is no pure black or pure grey anywhere: ink is coffee (`text` #2c1c12), the overlay is warm-tinted, shadows are brown-based, the ground is `bg` #f7f7f6. The warmth is the brand's answer to the product's job — feedback should feel like a conversation, not an audit.
5. **States move surfaces, not borders.** Hover deepens `surface-2` → `surface-3`; selection tints with `accent-weak`; focus draws the `focus-ring`. Borders are for hairline dividers (`border`) only.
6. **Motion is feedback, never theatre.** Every animation answers "did my action land?": buttons dip 3% on press, modals scale in over 160ms, chart bars grow from the baseline, a cited answer flashes `accent-weak` when a source tag scrolls to it. All of it collapses under `prefers-reduced-motion`.

## Color usage rules

- Large tinted areas use **solid** colors; `accent-weak` and the other alpha tints are for **small** areas (chips, highlights, the two report boxes). Alpha gold composited over grey drifts muddy — this rule exists because we shipped that bug once.
- Gold text on light grounds is always `gold-700`, never `accent`.
- The tooltip is the one dark surface: `tooltip-ink` ground, white text. Every tooltip in the product uses it — bar-chart hovers, info icons, discussion hints.
- Illustrations (landing scene, empty-state sailboat) are inline SVG filled **only with tokens** — `accent` sails, `gold-400` sun, `text-muted` hull — so they can never drift off-palette.

## Typography

Three faces, three jobs:

- **Bricolage Grotesque** (`display`) — headings only. Characterful, tight-tracked (−0.02em), weight 700–800. It *is* the brand voice; body text never uses it.
- **Hanken Grotesk** (`body`) — everything you read. Neutral, humanist, comfortable at 14–15px.
- **JetBrains Mono** (`mono`) — uppercase eyebrows and speaker labels, +0.12em tracked. A small technical wink, used sparingly.

Both display and body are Google-hosted (`fonts.googleapis.com`, family names in `type.families`); no font binaries ship with the system.

## Iconography & illustration

Icons are a single hand-kept set of 1.5px-stroke line icons (sparkles for AI, message for discussion, a thought bubble for team mood) drawn at 24px viewBox and sized 13–22px in use. Illustrations are hand-drawn inline SVGs on the same palette; PNG art is banned from the repo — the wordmark is the single exception (see Logos).

## Motion inventory

| Moment | Behavior | Tokens |
|---|---|---|
| Button press | scale(0.97), ~80ms | — |
| Modal enter | fade + scale 0.96→1, 160ms | `shadow-lg` |
| Route change | 3px gold top progress bar, trickle to 90%, complete on settle | `accent` |
| AI generating | cycling status line + bouncing dots + shimmer skeleton | `surface-2/3` |
| Chart mount | bars scaleY from baseline, 60ms stagger; stat numbers count up 700ms | mood greens/golds/reds |
| Source-tag jump | smooth scroll, then a 3.2s hold-and-fade flash | `accent-weak` |

## Governance: the system as an AI contract

This product was designed by a human and implemented with an AI agent. The design system is the contract between them: every new component must take its colors, radii and type from tokens; illustrations must be token-filled SVG; every user-facing string ships in English and Traditional Chinese together. Because the constraints live in code (CSS custom properties), the AI could be *audited* against them — dozens of features and micro-interactions later, the UI still resolves to one system. Treat the tokens as law: propose a new token before hard-coding a value.

## Not synced

Component previews below are hand-written renditions of the production CSS (`app/globals.css`, `components/*.tsx`) — the React components themselves are Next.js app code and are not bundled here. Fonts are Google-hosted, so no font files are included. Colors, radii, shadows and type values are exact copies from `:root` in `app/globals.css`.
