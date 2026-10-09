A menu is a floating panel anchored below its trigger — one style app-wide, reverse-engineered from UserMenu (the team menu) and the results page's group-by menu.

## Structure

`surface` fill, `radius-xl`, 4px padding (p-1), `shadow-md` (the menu-tier shadow — only modals take `shadow-lg`), width by content (UserMenu: 208px). Anchored `space-2` below the trigger, flush to its right edge. Optional header block (px-3 py-2: bold primary line + `text-subtle` secondary) and an `h-px` `border`-colored divider with `space-1` margins.

## Items

Each item: `radius-lg`, px-3 py-2, body-sm label, 15px icon with a `space-2` gap, hover tints `surface-2` — never a border. Destructive items use `red-500` text. Selected state (e.g. the group-by menu's current value) is marked with a check icon, not a fill change.

## Behavior

Opening lays an invisible `fixed inset-0` click layer — clicking outside closes; Esc closes (`lib/useEscClose`); at most one menu open at a time. Items close the menu after acting. Enter with the 160ms pop (transform/opacity); appears instantly under `prefers-reduced-motion`.
