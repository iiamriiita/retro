The modal is the one surface that truly floats: the warm `overlay` dim, a `shadow-lg` panel at `radius-xl`, entering with the 160ms pop. Hand-written from `AuthModal`, `TeamModal` and the share dialog.

## Anatomy

- **Title** in headline-sm; body-md text below.
- **Action row** at the bottom: the gold primary — **one per view** (a modal is its own view); secondary actions are ghost; destructive confirmations use danger, and then no gold appears in the modal at all.
- Max width 460px, max height 90vh with inner scroll; card padding (20/22px).

## When to use

Interrupting decisions only: confirm, sign-in, share. Anything longer than two steps gets a page, not a modal. Backdrop click and Esc close it; closing must never lose user input (confirm first when the form is dirty).
