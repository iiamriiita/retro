// Flat illustration for the share popup hero: a checklist being sent to
// teammates. Self-contained SVG (no external asset).
export default function ShareHeroArt({ className }: { className?: string }) {
  const person = (cx: number, cy: number, r: number, fill: string) => (
    <>
      <circle cx={cx} cy={cy - r * 0.28} r={r * 0.32} fill={fill} />
      <path
        d={`M ${cx - r * 0.55} ${cy + r * 0.55}
            a ${r * 0.55} ${r * 0.55} 0 0 1 ${r * 1.1} 0 Z`}
        fill={fill}
      />
    </>
  );

  return (
    <svg
      viewBox="0 0 560 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* soft blobs */}
      <ellipse cx="180" cy="160" rx="150" ry="135" fill="rgba(255,255,255,0.14)" />
      <circle cx="440" cy="150" r="105" fill="rgba(255,255,255,0.16)" />

      {/* dotted paths from the card to the avatars */}
      <path
        d="M262 150 C 330 110, 380 100, 452 108"
        stroke="rgba(68,44,28,0.55)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="1 14"
      />
      <path
        d="M262 205 C 340 235, 380 230, 448 216"
        stroke="rgba(68,44,28,0.55)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="1 14"
      />

      {/* sparkle */}
      <path
        d="M410 150 l6 12 12 6 -12 6 -6 12 -6 -12 -12 -6 12 -6 z"
        fill="#ffffff"
      />

      {/* checklist card */}
      <g>
        <rect x="72" y="70" width="200" height="176" rx="20" fill="#ffffff" />
        {/* gold header */}
        <path
          d="M72 90 a20 20 0 0 1 20 -20 h160 a20 20 0 0 1 20 20 v22 h-200 z"
          fill="#F0B90B"
        />
        <circle cx="100" cy="90" r="12" fill="#2C1C12" />
        <path
          d="M95 90 l3.5 3.5 6.5 -7"
          stroke="#F0B90B"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect x="122" y="83" width="118" height="12" rx="6" fill="#C79200" />

        {/* rows */}
        <circle cx="102" cy="146" r="9" fill="#5BA36B" />
        <rect x="122" y="140" width="118" height="12" rx="6" fill="#E7DCCB" />
        <circle cx="102" cy="182" r="9" fill="#D5544A" />
        <rect x="122" y="176" width="96" height="12" rx="6" fill="#E7DCCB" />
        <circle cx="102" cy="218" r="9" fill="#F0B90B" />
        <rect x="122" y="212" width="118" height="12" rx="6" fill="#E7DCCB" />
      </g>

      {/* paper airplane */}
      <path
        d="M250 250 l58 -22 -22 44 -12 -16 z"
        fill="#3B2718"
      />

      {/* avatars */}
      <g>
        <circle cx="472" cy="108" r="34" fill="#2C1C12" />
        {person(472, 108, 34, "#F0B90B")}
      </g>
      <g>
        <circle cx="448" cy="214" r="28" fill="#7E5232" />
        {person(448, 214, 28, "#ffffff")}
      </g>
    </svg>
  );
}
