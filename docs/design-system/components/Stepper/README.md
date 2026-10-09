Step indication has **two modes** sharing one vocabulary. Hand-written from `CreateWizard` (step dots) and `FillWizard` (fill progress); writing this spec also fixed CreateWizard's `bg-gray-200` violation (inactive steps now use `surface-3`).

## Display mode (wizard dots)

8px dots at `space-2` gaps: reached = solid `accent`, not yet = `surface-3`. The current step may carry a label-sm caption below. Use dots for 2–4 steps; beyond that, switch to the progress mode.

## Progress mode (continuous bar)

`surface-3` track, `accent` fill, 6px tall, `radius-pill` — same family as the top route-progress bar. A "step n of N" label in label-sm, `text-subtle`. Progress moves over 200ms (the "fast" duration step).
