Step indication is a **segmented progress bar**: one segment per step, each `flex-1` to fill the row, reached segments (current included) in `accent`, upcoming ones in `surface-3`. Hand-written from `CreateWizard` and `FillWizard` — both wizards use the **same pattern**; only the segment count differs.

## Specs

Segments are 6px tall, `radius-pill` capped, with `space-1` (4px) gaps. Advancing tints the next segment gold over 200ms (the "fast" duration step). Works for 2–N steps; this system has **no dot-style** stepper.

## Family and boundary

Same family: the top route-progress bar (the continuous `accent` strip) — one "gold = in progress" vocabulary.
Out of scope: node-style flow steppers (like the ERP test's ApprovalStepper) are a separate proposal when needed.

(Writing this spec also fixed CreateWizard's `bg-gray-200` violation — upcoming segments now use `surface-3`.)
