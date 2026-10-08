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
