// Flat illustrations for the Sailboat, Garden and Space Mission templates'
// roles, keyed by the role emoji. Falls back to rendering the emoji itself
// for any other role.
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
    case "👩‍🚀": // Commander — astronaut / robot head
      return svg(
        <>
          {/* shoulders */}
          <path
            d="M150 446 C 150 380 198 338 256 338 C 314 338 362 380 362 446 Z"
            fill={GOLD}
          />
          {/* ears */}
          <rect x="88" y="176" width="48" height="92" rx="24" fill="#E7DCCB" />
          <rect x="376" y="176" width="48" height="92" rx="24" fill="#E7DCCB" />
          {/* head */}
          <circle cx="256" cy="206" r="140" fill={CREAM} />
          {/* visor */}
          <rect x="182" y="156" width="148" height="100" rx="50" fill={DARK} />
          {/* eye */}
          <rect x="214" y="190" width="46" height="38" rx="16" fill={GOLD} />
          {/* chest badge */}
          <rect x="232" y="352" width="48" height="34" rx="11" fill={CREAM} />
        </>,
      );
    case "🛰️": // Mission control — satellite with solar panels
      return svg(
        <>
          {/* connecting rods */}
          <rect x="120" y="242" width="272" height="16" rx="8" fill={BROWN} />
          {/* solar panels */}
          <rect x="70" y="210" width="112" height="80" rx="12" fill={GOLD} />
          <rect x="330" y="210" width="112" height="80" rx="12" fill={GOLD} />
          <g fill={DARK}>
            <rect x="99" y="210" width="9" height="80" />
            <rect x="127" y="210" width="9" height="80" />
            <rect x="155" y="210" width="9" height="80" />
            <rect x="356" y="210" width="9" height="80" />
            <rect x="384" y="210" width="9" height="80" />
            <rect x="412" y="210" width="9" height="80" />
          </g>
          <rect
            x="70"
            y="210"
            width="112"
            height="80"
            rx="12"
            fill="none"
            stroke={DARK}
            strokeWidth="14"
          />
          <rect
            x="330"
            y="210"
            width="112"
            height="80"
            rx="12"
            fill="none"
            stroke={DARK}
            strokeWidth="14"
          />
          {/* body */}
          <rect x="204" y="236" width="104" height="146" rx="32" fill={DARK} />
          <rect x="222" y="256" width="68" height="108" rx="22" fill={CREAM} />
          {/* docking port */}
          <circle cx="256" cy="204" r="48" fill={DARK} />
          <circle cx="256" cy="204" r="30" fill={CREAM} />
          <rect x="248" y="150" width="16" height="34" rx="8" fill={DARK} />
        </>,
      );
    case "🔧": // Engineer — crossed wrench and screwdriver
      return svg(
        <>
          {/* wrench (\) */}
          <g transform="rotate(-45 256 256)">
            <rect x="236" y="150" width="40" height="212" rx="20" fill={GOLD} />
            <path
              d="M284 100 A 40 40 0 1 1 228 100"
              stroke={GOLD}
              strokeWidth="30"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M228 412 A 40 40 0 1 1 284 412"
              stroke={GOLD}
              strokeWidth="30"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          {/* screwdriver (/) */}
          <g transform="rotate(45 256 256)">
            <path d="M242 96 L270 96 L276 168 L236 168 Z" fill={CREAM} />
            <rect x="242" y="160" width="28" height="152" fill={GOLD} />
            <rect x="228" y="300" width="56" height="24" rx="8" fill="#C9A24A" />
            <rect x="220" y="318" width="72" height="104" rx="24" fill={BROWN} />
            <g stroke="#5E3D24" strokeWidth="8" strokeLinecap="round">
              <line x1="244" y1="342" x2="244" y2="400" />
              <line x1="256" y1="342" x2="256" y2="400" />
              <line x1="268" y1="342" x2="268" y2="400" />
            </g>
          </g>
        </>,
      );
    case "📡": // Comms officer — satellite dish on a tripod
      return svg(
        <>
          {/* tripod legs */}
          <line
            x1="248"
            y1="298"
            x2="198"
            y2="452"
            stroke={DARK}
            strokeWidth="22"
            strokeLinecap="round"
          />
          <line
            x1="262"
            y1="300"
            x2="262"
            y2="456"
            stroke={DARK}
            strokeWidth="22"
            strokeLinecap="round"
          />
          <line
            x1="272"
            y1="298"
            x2="330"
            y2="448"
            stroke={DARK}
            strokeWidth="22"
            strokeLinecap="round"
          />
          {/* dish */}
          <g transform="rotate(-28 256 236)">
            <ellipse
              cx="256"
              cy="236"
              rx="152"
              ry="106"
              fill={CREAM}
              stroke={DARK}
              strokeWidth="22"
            />
            <ellipse cx="256" cy="236" rx="64" ry="44" fill={GOLD} />
            <line
              x1="252"
              y1="228"
              x2="198"
              y2="116"
              stroke={DARK}
              strokeWidth="20"
              strokeLinecap="round"
            />
            <circle cx="194" cy="108" r="24" fill={GOLD} />
          </g>
        </>,
      );
    case "⭐": // Stargazer — star
      return svg(
        <>
          <path
            d="M256 82 L303 207 L437 213 L332 297 L368 426 L256 352
               L144 426 L180 297 L75 213 L209 207 Z"
            fill={GOLD}
          />
          <path
            d="M256 82 L303 207 L437 213 L332 297 L368 426 L256 352 Z"
            fill="#E0A800"
            opacity="0.35"
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
