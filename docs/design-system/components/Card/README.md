The card is the system's only container: a flat white rectangle on the warm ground. Hand-written from `app/globals.css` (`.card`).

`surface` fill, `radius-lg`, padding `space-5` block / `space-5x` inline — **no border, no shadow**. Separation from the page comes entirely from the `bg` → `surface` step, which is why the ground must never be pure white. Inside a card, recessed things (inputs, answer tiles) use `surface-2`; tinted meaning (report boxes) uses `green-weak`/`red-weak` at `radius-xl`. Cards never nest cards.
