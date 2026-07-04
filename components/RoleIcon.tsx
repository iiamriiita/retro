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
  const GREEN = "#5BA36B";
  const GREEN_DARK = "#4E8C5A";
  const CREAM = "#EDE4D6";

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
    case "🌻": // Gardener — sunflower
      return svg(
        <>
          <rect x="244" y="248" width="22" height="196" rx="11" fill={GREEN_DARK} />
          <path
            d="M244 334 C 200 322 170 300 156 300 C 168 342 210 358 244 356 Z"
            fill={GREEN}
          />
          {Array.from({ length: 10 }).map((_, i) => (
            <ellipse
              key={i}
              cx="256"
              cy="112"
              rx="20"
              ry="52"
              fill={GOLD}
              transform={`rotate(${i * 36} 256 200)`}
            />
          ))}
          <circle cx="256" cy="200" r="64" fill={BROWN} />
        </>,
      );
    case "🌱": // Sprout — seedling
      return svg(
        <>
          <rect x="245" y="248" width="22" height="188" rx="11" fill={BROWN} />
          <path
            d="M256 268 C 200 268 156 236 150 206 C 202 208 250 236 256 268 Z"
            fill={GREEN}
          />
          <path
            d="M256 256 C 306 234 350 198 356 170 C 316 172 274 210 256 256 Z"
            fill={GREEN_DARK}
          />
        </>,
      );
    case "🐝": // Bee
      return svg(
        <>
          <ellipse
            cx="188"
            cy="182"
            rx="70"
            ry="40"
            fill={CREAM}
            transform="rotate(-18 188 182)"
          />
          <ellipse
            cx="324"
            cy="182"
            rx="70"
            ry="40"
            fill={CREAM}
            transform="rotate(18 324 182)"
          />
          <path
            d="M232 120 C 222 96 210 92 202 84"
            stroke={DARK}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M280 120 C 290 96 302 92 310 84"
            stroke={DARK}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="200" cy="82" r="12" fill={DARK} />
          <circle cx="312" cy="82" r="12" fill={DARK} />
          <circle cx="256" cy="162" r="52" fill={DARK} />
          <ellipse cx="256" cy="322" rx="112" ry="94" fill={GOLD} />
          <rect x="150" y="292" width="212" height="26" fill={DARK} />
          <rect x="170" y="346" width="172" height="26" fill={DARK} />
        </>,
      );
    case "☔": // Rain — umbrella
      return svg(
        <>
          <circle cx="256" cy="86" r="16" fill={BROWN} />
          <rect x="248" y="96" width="16" height="34" fill={BROWN} />
          <path
            d="M96 254 C 100 152 170 92 256 92 C 342 92 412 152 416 254
               L 360 226 L 320 254 L 288 226 L 256 254 L 224 226 L 192 254 L 152 226 Z"
            fill={GOLD}
          />
          <path
            d="M256 254 L256 404 C256 434 232 450 208 442 C194 438 186 426 188 412"
            stroke={DARK}
            strokeWidth="18"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M332 302 L318 340"
            stroke={BROWN}
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M374 320 L360 358"
            stroke={BROWN}
            strokeWidth="14"
            strokeLinecap="round"
          />
        </>,
      );
    case "🍂": // Fallen leaf — seed pod
      return svg(
        <>
          <ellipse cx="256" cy="432" rx="72" ry="12" fill="#D8C9B0" />
          <path
            d="M256 88 C 350 128 382 240 342 328 C 302 398 210 398 172 328 C 132 240 162 128 256 88 Z"
            fill={GOLD}
          />
          <path
            d="M300 120 C 252 214 222 300 198 384"
            stroke={BROWN}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M262 196 L212 172"
            stroke={BROWN}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M242 256 L302 240"
            stroke={BROWN}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M224 318 L296 304"
            stroke={BROWN}
            strokeWidth="12"
            strokeLinecap="round"
          />
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
