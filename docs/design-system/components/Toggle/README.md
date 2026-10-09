The switch controls session-level modes (discussion on/off) with optimistic state. Hand-written from `components/OwnerSidebar.tsx`.

Track 24×44px at `radius-pill`; knob 20px white with a soft shadow, sliding 0.5→edge. Off: `surface-3` track. On: `accent` track — the only moment the accent fills a control's whole body, which is what makes the state legible at a glance. The label sits left in label-lg style; a one-line hint below in `text-muted` explains what "on" means. State changes apply optimistically and roll back on error.
