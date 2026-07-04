// Flat illustrations for the Sailboat template's five roles, keyed by the
// role emoji. Falls back to rendering the emoji itself for any other role.
export default function RoleIcon({
  emoji,
  size = 40,
}: {
  emoji: string;
  size?: number;
}) {
  const svg = (children: React.ReactNode) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {children}
    </svg>
  );

  const DARK = "#2C1C12";
  const BROWN = "#7E5232";
  const GOLD = "#ECC30B";

  switch (emoji) {
    case "🧭": // Helm — compass
      return svg(
        <>
          <circle
            cx="256"
            cy="256"
            r="196"
            fill="#F1E7DA"
            stroke={DARK}
            strokeWidth="34"
          />
          <path d="M256 150 L232 268 L280 268 Z" fill={GOLD} />
          <path d="M256 362 L232 268 L280 268 Z" fill={BROWN} />
          <circle cx="256" cy="268" r="22" fill={DARK} />
        </>,
      );
    case "⛵": // Sail — sailboat
      return svg(
        <>
          <rect x="248" y="96" width="16" height="230" rx="8" fill={DARK} />
          <path d="M256 100 L156 320 L256 320 Z" fill={DARK} />
          <path d="M256 118 L356 320 L256 320 Z" fill={BROWN} />
          <path d="M150 330 L362 330 L326 402 L186 402 Z" fill={GOLD} />
        </>,
      );
    case "⚓": // Anchored — anchor
      return svg(
        <>
          <circle
            cx="256"
            cy="104"
            r="46"
            fill="none"
            stroke={DARK}
            strokeWidth="34"
          />
          <rect x="239" y="150" width="34" height="252" rx="17" fill={DARK} />
          <rect x="176" y="196" width="160" height="30" rx="15" fill={DARK} />
          <path
            d="M96 296 C 108 402 176 442 256 442 C 336 442 404 402 416 296
               L 380 296 C 370 372 320 408 256 408 C 192 408 142 372 132 296 Z"
            fill={GOLD}
          />
          <path d="M96 296 l -20 -34 44 6 z" fill={GOLD} />
          <path d="M416 296 l 20 -34 -44 6 z" fill={GOLD} />
        </>,
      );
    case "🔭": // Lookout — telescope
      return svg(
        <>
          <g transform="rotate(-26 256 200)">
            <rect x="112" y="168" width="298" height="62" rx="31" fill={GOLD} />
            <rect x="108" y="166" width="46" height="66" rx="23" fill={DARK} />
            <rect x="368" y="162" width="52" height="74" rx="26" fill={DARK} />
            <rect x="214" y="168" width="16" height="62" fill={DARK} />
            <rect x="300" y="168" width="16" height="62" fill={DARK} />
          </g>
          <rect x="228" y="300" width="56" height="54" rx="12" fill={BROWN} />
          <path
            d="M244 348 L150 470"
            stroke={DARK}
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M268 348 L362 470"
            stroke={DARK}
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M256 352 L256 482"
            stroke={DARK}
            strokeWidth="20"
            strokeLinecap="round"
          />
        </>,
      );
    case "🐙": // Kraken-slayer — octopus
      return svg(
        <>
          <path d="M150 312 a106 106 0 0 1 212 0 Z" fill={GOLD} />
          <circle cx="216" cy="252" r="15" fill={DARK} />
          <circle cx="296" cy="252" r="15" fill={DARK} />
          <g fill={BROWN}>
            <path d="M156 306 c -34 18 -46 60 -22 92 c 16 -6 24 -22 22 -44 c -2 -22 6 -36 22 -48 z" />
            <path d="M206 312 c -14 40 -14 78 6 104 c 14 -20 16 -50 8 -104 z" />
            <path d="M256 314 q 8 56 0 106 q -8 -50 0 -106 z" />
            <path d="M300 312 c 14 40 14 78 -6 104 c -14 -20 -16 -50 -8 -104 z" />
            <path d="M356 306 c 34 18 46 60 22 92 c -16 -6 -24 -22 -22 -44 c 2 -22 -6 -36 -22 -48 z" />
          </g>
        </>,
      );
    default:
      return (
        <span
          aria-hidden="true"
          style={{ fontSize: size * 0.82, lineHeight: 1 }}
        >
          {emoji}
        </span>
      );
  }
}
