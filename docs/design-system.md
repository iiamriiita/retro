> **Packed view.** This file bundles the sources in `docs/design-system/`
> (tokens.json · README.md · motion.md · components/*/README.md) into one
> path for quick reading. The folder is the canonical, file-per-file form;
> both are kept in sync by the update workflow.

# Team Retro

**Honest team feedback, minus the awkward.** Team Retro is a retrospective tool for 2–5-person teams: one link collects anonymous answers, and AI sorts them into highlights, improvements and next steps. The design system exists to make a potentially tense ritual feel **warm, calm and safe** — and, because the product was built in an AI pair-programming loop, to act as the **guardrail that kept dozens of AI-built iterations visually coherent**.

The visual identity in one line: *warm paper, one gold, flat surfaces, brown ink.*

## Principles

1. **Flat first.** Cards have no border and no shadow; hierarchy comes from surface steps (`bg` → `surface` → `surface-2` → `surface-3`). Elevation is reserved for things that truly float — menus and modals get `shadow-md`/`shadow-lg`, nothing else does (one sanctioned exception: the card-style confirm dialog stays deliberately flat — see the Modal spec). If a design needs a card to "pop", the answer is a surface step or spacing, never a new shadow.
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

---

# Motion

Motion in Team Retro is **feedback, never theatre**: every animation answers "did my action land?" — a press acknowledged, a modal arriving, a citation found. Nothing animates for decoration, and the entire system collapses to zero under `prefers-reduced-motion` (one media query disables every keyframe and transition).

## Duration scale

| Step | Duration | Used for |
|---|---|---|
| Instant | **80ms** | Button press dip `scale(0.97)` |
| Fast | **150–200ms** | Color transitions (150), modal enter (160), switch slide and tooltip (200) |
| Medium | **300–500ms** | Content fade-ins (350), chart bars growing from the baseline (500, 60ms stagger) |
| Slow | **700ms** | Stat numbers counting up |
| Ambient | **2.6s+** | AI-generating status cycle (2.6s), source-flash hold-and-fade (3.2s), empty-state sailboat bob (4.2s loop) |

Rule of thumb: the smaller and more frequent the interaction, the shorter the duration. Anything a user triggers dozens of times a session (presses, hovers) stays under 200ms; anything that happens once per page (charts mounting, a citation flash) may take longer because it carries information.

## Easing

| Curve | Value | Used for |
|---|---|---|
| Signature pop | `cubic-bezier(0.16, 1, 0.3, 1)` | Modal enter, bar growth, the Copied check — an overshoot-then-settle that reads as friendly, matching the brand's warmth |
| ease-out | browser default | Ordinary entrances and fades |
| ease-in-out | browser default | Loops (dots bounce, sailboat bob) |
| linear | — | Shimmer skeletons only — a constant sheen must not pulse |

## Rules

1. **Animate transform and opacity only.** Never height, width or layout properties — no reflow, no jank.
2. **Enter from visible states.** Content is readable the moment it exists; animation layers on top, it never gates readability (no `opacity: 0` waiting for an observer).
3. **One kill switch.** Every keyframe and transition is disabled under `prefers-reduced-motion: reduce`; count-ups jump straight to the final number.
4. **Loops must mean "in progress".** The only perpetual animations are the AI-generating indicators and the empty-state sailboat — both say "something is (or could be) happening". Idle content never loops.

## Moment inventory

| Moment | Behavior | Duration · easing | Tokens |
|---|---|---|---|
| Button press | dip `scale(0.97)` | 80ms | — |
| Modal / dialog enter | fade + scale 0.96→1, overlay fades | 160ms · pop | `shadow-lg`, `overlay` |
| Route change | 3px top bar trickles to 90%, completes on settle | trickle 200ms steps | `accent` |
| AI generating | cycling status line, 3 bouncing dots, shimmer skeleton | 2.6s cycle · 1s · 1.4s linear | `accent`, `surface-2/3` |
| Chart mount | bars `scaleY` 0→1 staggered; numbers count up | 500ms + 60ms/bar · 700ms | mood greens/golds/reds |
| Source-tag jump | smooth scroll, then hold-and-fade highlight | 3.2s (hold 70%) | `accent-weak` |
| Switch toggle | knob slides, track recolors | 200ms | `accent`, `surface-3` |
| Copied confirmation | check icon pops in | 200ms · pop | `accent` |

---

## Design tokens (machine-readable)

All values below are the source of truth, copied verbatim from `app/globals.css`.

```json
{
  "name": "Team Retro",
  "version": 1,
  "meta": {
    "source": "github",
    "repo": "iiamriiita/retro",
    "paths": {
      "tokens": [
        "app/globals.css",
        "tailwind.config.ts"
      ],
      "assets": [
        "public/logo.png"
      ],
      "docs": [
        "app/globals.css comments",
        "component sources"
      ]
    },
    "synced": "2026-10-09",
    "omitted": [
      {
        "section": "motion",
        "reason": "The token format has no motion family — motion rules live in motion.md"
      }
    ]
  },
  "color": {
    "themes": [
      {
        "id": "light",
        "name": "Light"
      }
    ],
    "tokens": [
      {
        "name": "bg",
        "value": "#f7f7f6",
        "usage": "Page ground. A warm off-white — never pure grey — so white cards read as objects on it."
      },
      {
        "name": "surface",
        "value": "#ffffff",
        "usage": "Cards and panels. Flat: no border, no shadow; the step up from bg is the whole separation."
      },
      {
        "name": "surface-2",
        "value": "#f3f2f0",
        "usage": "Recessed fills inside a card: inputs, answer tiles, ghost buttons, chart tooltips' ground."
      },
      {
        "name": "surface-3",
        "value": "#eae8e4",
        "usage": "Hover state of surface-2 fills, neutral badges, source-tag chips. States move one surface step, they never add borders."
      },
      {
        "name": "overlay",
        "value": "rgba(30, 24, 18, 0.3)",
        "usage": "Dim layer behind modals — warm-tinted, not pure black."
      },
      {
        "name": "border",
        "value": "#e6e3de",
        "usage": "Hairline dividers only (report summary underline, header rule). Cards never use it."
      },
      {
        "name": "border-strong",
        "value": "#d6d2cb",
        "usage": "Rare stronger rule when a hairline vanishes on surface-2."
      },
      {
        "name": "text",
        "value": "#2c1c12",
        "usage": "Primary ink — a deep coffee brown, not black. Headings, body, button labels on gold."
      },
      {
        "name": "text-muted",
        "value": "#7e5232",
        "usage": "Secondary ink: descriptions, hints, section labels. Also the hull/mast brown in illustrations."
      },
      {
        "name": "text-subtle",
        "value": "#9c948a",
        "usage": "Tertiary ink: timestamps, empty states, placeholder text."
      },
      {
        "name": "text-inverse",
        "value": "{text}",
        "usage": "Label ink on accent fills. Gold is light, so the 'inverse' is the same dark brown — by design."
      },
      {
        "name": "accent-ink",
        "value": "{text}",
        "usage": "Ink on gold elements. Aliases text — follows any ink change (same role as text-inverse; declared in :root)."
      },
      {
        "name": "accent",
        "value": "#f0b90b",
        "usage": "THE action color. Primary buttons, active toggles, progress bar, focus. One accent does all interactive work."
      },
      {
        "name": "accent-hover",
        "value": "#fcd535",
        "usage": "Accent hover — lighter, not darker: the button brightens under the cursor."
      },
      {
        "name": "accent-press",
        "value": "#d9a400",
        "usage": "Accent pressed state, paired with a scale(0.97) dip."
      },
      {
        "name": "accent-weak",
        "value": "rgba(240, 185, 11, 0.16)",
        "usage": "Small-area gold tints: selected chips, quote highlights, flash-on-scroll. Large areas use a solid — alpha over grey goes muddy. (= accent at 16% alpha.)"
      },
      {
        "name": "gold-400",
        "value": "{accent-hover}",
        "usage": "Bright gold for illustration highlights (jib sail, sun) and small marks. Aliases accent-hover — there is only one bright gold."
      },
      {
        "name": "gold-700",
        "value": "#a67c00",
        "usage": "Readable gold: links and gold text on light grounds, where accent itself fails contrast."
      },
      {
        "name": "green-500",
        "value": "#47854f",
        "usage": "Semantic positive: 'What's going well' bullets, success badges, high mood scores."
      },
      {
        "name": "green-weak",
        "value": "rgba(71, 133, 79, 0.14)",
        "usage": "Positive tint fill — the green report box, success badge ground."
      },
      {
        "name": "red-500",
        "value": "#d5544a",
        "usage": "Semantic negative: 'What to improve' markers, low mood, destructive buttons."
      },
      {
        "name": "danger-weak",
        "value": "rgba(213, 84, 74, 0.1)",
        "usage": "Negative tint fill — the red report box. (Used via a fallback expression in the product.)"
      },
      {
        "name": "tooltip-ink",
        "value": "#452c1c",
        "usage": "Tooltip ground: deep warm brown with white text, the one dark surface in the UI. (Currently hardcoded in the product.)"
      },
      {
        "name": "focus-ring",
        "value": "rgba(240, 185, 11, 0.5)",
        "usage": "Focus ring, drawn as a 2px box-shadow on inputs. The value is accent at 50% alpha; alpha cannot be expressed by reference, so the literal stays."
      }
    ]
  },
  "type": {
    "fonts": [],
    "families": {
      "display": "\"Bricolage Grotesque\", \"Hanken Grotesk\", system-ui, sans-serif",
      "body": "\"Hanken Grotesk\", system-ui, -apple-system, sans-serif",
      "mono": "\"JetBrains Mono\", ui-monospace, monospace"
    },
    "groups": [
      {
        "name": "Headline",
        "family": "display",
        "styles": [
          {
            "name": "headline-lg",
            "fontSize": "56px",
            "lineHeight": 1.02,
            "fontWeight": 800,
            "letterSpacing": "-0.03em",
            "sample": "Honest team feedback, minus the awkward.",
            "usage": "Landing headline only."
          },
          {
            "name": "headline-md",
            "fontSize": "24px",
            "lineHeight": 1.2,
            "fontWeight": 800,
            "letterSpacing": "-0.02em",
            "sample": "My retros",
            "usage": "One per page."
          },
          {
            "name": "headline-sm",
            "fontSize": "18px",
            "lineHeight": 1.2,
            "fontWeight": 700,
            "letterSpacing": "-0.02em",
            "sample": "AI report",
            "usage": "Card and section headings (h2–h4 map here automatically)."
          }
        ]
      },
      {
        "name": "Body",
        "family": "body",
        "styles": [
          {
            "name": "body-lg",
            "fontSize": "17px",
            "lineHeight": 1.5,
            "fontWeight": 500,
            "sample": "Pairing clearly paid off this sprint; requirement sync is still the friction.",
            "usage": "Reserved for the AI report's summary quote."
          },
          {
            "name": "body-md",
            "fontSize": "15px",
            "lineHeight": 1.55,
            "fontWeight": 400,
            "sample": "Pairing on the auth refactor sped up work and caught edge cases.",
            "usage": "Answers, report bullets, reading text."
          },
          {
            "name": "body-sm",
            "fontSize": "14px",
            "lineHeight": 1.5,
            "fontWeight": 400,
            "sample": "What people opening the shared link can see.",
            "usage": "Descriptions and hints. Button labels use the button style."
          }
        ]
      },
      {
        "name": "Label",
        "family": "body",
        "styles": [
          {
            "name": "label-lg",
            "fontSize": "15px",
            "lineHeight": 1.4,
            "fontWeight": 500,
            "sample": "What's going well",
            "usage": "Sub-headings inside cards: report boxes, sidebar cards, stat labels."
          },
          {
            "name": "label-md",
            "fontSize": "12px",
            "lineHeight": 1.3,
            "fontWeight": 600,
            "sample": "Email",
            "usage": "Form labels, in text-muted."
          },
          {
            "name": "label-sm",
            "fontSize": "12px",
            "lineHeight": 1.4,
            "fontWeight": 500,
            "sample": "AI generated · for reference",
            "usage": "Timestamps, badges, footnotes."
          },
          {
            "name": "button",
            "fontSize": "14px",
            "lineHeight": 1,
            "fontWeight": 600,
            "letterSpacing": "-0.01em",
            "sample": "Generate AI report",
            "usage": "Button labels — body family. Geometry lives on the Button component."
          }
        ]
      },
      {
        "name": "Mono",
        "family": "mono",
        "styles": [
          {
            "name": "eyebrow",
            "fontSize": "14px",
            "lineHeight": 1.4,
            "fontWeight": 500,
            "letterSpacing": "0.12em",
            "sample": "TEAM RETRO",
            "usage": "Uppercase kickers and speech-bubble speaker labels on the landing scene."
          }
        ]
      }
    ]
  },
  "spacing": {
    "note": "Built on the Tailwind 4px grid; these are the steps the product actually uses.",
    "tokens": [
      {
        "name": "space-1",
        "value": "4px",
        "usage": "Icon-to-label gaps, chip padding."
      },
      {
        "name": "space-2",
        "value": "8px",
        "usage": "Tight sibling gaps: tag rows, dot bullets."
      },
      {
        "name": "space-3",
        "value": "12px",
        "usage": "List item gaps (answer cards, report bullets)."
      },
      {
        "name": "space-4",
        "value": "16px",
        "usage": "Padding inside tint boxes; grid gaps between cards. Also the minimum page side gutter."
      },
      {
        "name": "space-5",
        "value": "20px",
        "usage": "Card block padding (inline is space-5x, 22px)."
      },
      {
        "name": "space-5x",
        "value": "22px",
        "usage": "Card inline padding — pairs with space-5 (20px block)."
      },
      {
        "name": "space-6",
        "value": "24px",
        "usage": "Between stacked sections in a column."
      },
      {
        "name": "space-10",
        "value": "40px",
        "usage": "Page-level breathing room around heroes and empty states."
      }
    ]
  },
  "radius": {
    "note": "Restrained, Supabase-like corners. Small enough to feel technical, round enough to feel warm.",
    "tokens": [
      {
        "name": "radius-sm",
        "value": "5px",
        "usage": "Badges, tiny marks."
      },
      {
        "name": "radius-md",
        "value": "7px",
        "usage": "Buttons, inputs, textareas."
      },
      {
        "name": "radius-lg",
        "value": "9px",
        "usage": "Cards."
      },
      {
        "name": "radius-xl",
        "value": "12px",
        "usage": "Report tint boxes, modal panels."
      },
      {
        "name": "radius-pill",
        "value": "999px",
        "usage": "Toggle track and knob, source-tag chips, chart bars' caps."
      }
    ]
  },
  "shadow": {
    "note": "Surfaces stay flat — a card never casts a shadow. Only layers that float above the page (menus, modals) lift, and the shadow is warm-toned.",
    "tokens": [
      {
        "name": "shadow-md",
        "value": "0 4px 12px rgba(24, 15, 9, 0.14)",
        "usage": "Dropdown menus, popovers, landing speech bubbles."
      },
      {
        "name": "shadow-lg",
        "value": "0 10px 28px rgba(24, 15, 9, 0.2)",
        "usage": "Modals and dialogs."
      },
      {
        "name": "shadow-xl",
        "value": "0 18px 44px rgba(24, 15, 9, 0.26)",
        "usage": "The largest overlays; rarely used."
      }
    ]
  }
}
```

---

# Component guidelines

## Button

Buttons are borderless filled rectangles: gold for the one primary action, a neutral fill for everything else, red only for destruction. Hand-written from `app/globals.css` (`.btn*`).

## Variants

- **Primary** — `accent` fill, `text-inverse` (dark brown) label. One per view. Hover *brightens* to `accent-hover`; active goes `accent-press` and the whole button dips to scale(0.97).
- **Ghost** — `surface-2` fill, `text` label; hover deepens to `surface-3`. The default for secondary actions; there is no outlined button in this system.
- **Text** — no fill, a `gold-700` readable-gold label; hover tints `accent-weak` (small-area legal). The secondary call when the view's gold is taken — **the designated style for AI-generate actions** (sparkles icon + label).
- **Danger** — `red-500` fill, for delete/close-session confirmations only.

## Specs

Height 36px (48px for landing CTAs), padding-inline `space-4`, `radius-md`, label in the `button` style (600, −0.01em), icon 14–15px with a `space-2` gap. Disabled: 45% opacity, no color shift. The consumer provides the label and click handler; loading states swap the label, they never spin inside the button.


## Card

The card is the system's only container: a flat white rectangle on the warm ground. Hand-written from `app/globals.css` (`.card`).

`surface` fill, `radius-lg`, padding `space-5` block / `space-5x` inline — **no border, no shadow**. Separation from the page comes entirely from the `bg` → `surface` step, which is why the ground must never be pure white. Inside a card, recessed things (inputs, answer tiles) use `surface-2`; tinted meaning (report boxes) uses `green-weak`/`danger-weak` at `radius-xl`. Cards never nest cards.


## Badge

Badges are small filled labels for status and counts; source tags are their round, clickable cousins on AI-report bullets. Hand-written from `app/globals.css` (`.badge*`) and `components/ReportPanel.tsx`.

## Badge

22px tall, `radius-sm`, label-sm type at weight 600, no border. Three fills: neutral (`surface-3` + `text-muted`), accent (`accent-weak` + `gold-700` — note the readable gold, never raw `accent` for text), success (`green-weak` + `green-500`).

## Source tag

An 18px `radius-pill` chip on `surface-3` showing a respondent's number (anonymous session) or name initial (named session). Clicking one scrolls to the cited answer and flashes it `accent-weak` — the chip is the proof that an AI bullet traces back to a real quote. The consumer provides the label and the jump target.


## TextField

Text inputs are recessed fills with no border; state lives in the background and the focus ring. Hand-written from `app/globals.css` (`.textarea`, `.field-label`).

Ground `surface-2`, `radius-md`, `space-3` inline padding, body-sm type; placeholder in `text-subtle`. Hover deepens to `surface-3`; focus returns to `surface-2` and draws the `focus-ring` as a 2px box-shadow — the ring is the accent color at half alpha, so "where am I typing" and "what can I click" share one hue. Labels sit above in label-md style, `text-muted`. Checkboxes and radios take `accent` via `accent-color`.


## Toggle

The switch controls session-level modes (discussion on/off) with optimistic state. Hand-written from `components/OwnerSidebar.tsx`.

Track 24×44px at `radius-pill`; knob 20px white with a soft shadow, sliding 0.5→edge. Off: `surface-3` track. On: `accent` track — the only moment the accent fills a control's whole body, which is what makes the state legible at a glance. The label sits left in label-lg style; a one-line hint below in `text-muted` explains what "on" means. State changes apply optimistically and roll back on error.


## ReportSection

The AI report layout is the product's signature pattern: a quoted one-line summary, then the semantic pair — a green box for what's going well, a red box for what to improve — then gold-arrow next steps. Hand-written from `components/ReportPanel.tsx`.

## Anatomy

- **Summary quote** in the `body-lg` style (17px/500, reserved for the quote), wrapped in oversized `accent`-colored quotation marks set in the display face; a `border` hairline closes the section.
- **The pair**: two `radius-xl` boxes on `green-weak` and `danger-weak` — the palette's semantic tokens carrying the data's meaning directly. Green bullets are 8px `green-500` dots; red bullets are `red-500` warning triangles. Titles in label-lg style.
- **Bullets** end with round source tags (see Badge) linking each claim to its origin answer.
- **Collapse**: lists longer than four items fold behind a centered "Show N more" text button in `text-muted` with a chevron that flips when open — a long red column must not dominate the layout.
- **Next steps** run full-width below with `gold-700` arrows.

Empty states say "Nothing specific this time." in `text-subtle` — never an apology, never a hidden section.

## Modal

The modal has **two sanctioned variants**, chosen by content weight. Both sit on the warm `overlay` dim, enter with the 160ms pop, and close on backdrop click; the gold primary is **one per view**, and destructive confirmations use danger with no gold anywhere in the window. Hand-written from AuthModal, TeamModal, the share dialog, the delete/close confirms and the report settings dialog.

### Panel (forms & content)

`surface` fill, `radius-xl`, 24px padding, `shadow-lg`. Size scale: forms max-w-md (448px); content-rich (e.g. share) max-w-lg (512px) — the content type may carry an X close in the top-right. Title in headline-sm, body in body-md.

### Hero header (the content panel's opener)

A content-rich panel may open with a **full-bleed hero band** (today's only case: the share dialog): a gold `linear-gradient(180deg, accent-hover → accent)` strip with a token-colored inline SVG illustration; the X close sits on the band — 36px, `radius-lg`, 55%-white ground, `text-inverse` icon. This is the system's **only sanctioned gradient**; gradients must not leak into any other component.

### Card confirm (two-button decisions)

Built directly from `.card`: `radius-lg`, **deliberately shadowless** — the constitutional exception to "overlays lift" (see README principle 1) — at max-w-sm (384px). Anatomy: label-lg title + body-sm line + action row (ghost cancel + danger or gold confirm). It holds one sentence and two buttons; anything more upgrades to Panel.

### Behavior

Backdrop click and Esc close it (Esc is not yet implemented — see debts); closing must never lose user input (confirm when the form is dirty). Flows longer than two steps get a page, not a modal.

### Debts (reality vs law, recorded honestly)

1. Six overlays use `bg-black/40` pure black — should be the `overlay` token (warm brown 30%).
2. Three panels and UserMenu use `shadow-xl` — should be `shadow-lg` for modals, `shadow-md` for menus.
3. The share dialog's `rounded-2xl` (16px, not a token radius) should be `radius-xl`; its `!h-11` buttons override the 36px standard.
4. Esc-to-close is unimplemented app-wide.
5. The hero X button’s `rgba(255,255,255,.55)` ground is a literal, not yet a token.

## SearchBar

The search bar is a TextField variant: the same recessed, borderless fill plus a magnifier and a clear button. Not yet used in the product — a forward spec for list/table scenes.

`surface-2` ground, `radius-md`, 36px tall, 12px inline padding; a 15px magnifier on the left in `text-subtle`; the clear button appears only when there is a value (an 18px circle on `surface-3`, built like the source tag). Placeholder in `text-subtle`; focus draws the `focus-ring`. Filters live — no separate submit button.

## Stepper

Step indication is a **segmented progress bar**: one segment per step, each `flex-1` to fill the row, reached segments (current included) in `accent`, upcoming ones in `surface-3`. Hand-written from `CreateWizard` and `FillWizard` — both wizards use the **same pattern**; only the segment count differs.

### Specs

Segments are 6px tall, `radius-pill` capped, with `space-1` (4px) gaps. Advancing tints the next segment gold over 200ms (the "fast" duration step). Works for 2–N steps; this system has **no dot-style** stepper.

### Family and boundary

Same family: the top route-progress bar (the continuous `accent` strip) — one "gold = in progress" vocabulary.
Out of scope: node-style flow steppers (like the ERP test's ApprovalStepper) are a separate proposal when needed.

(Writing this spec also fixed CreateWizard's `bg-gray-200` violation — upcoming segments now use `surface-3`.)
