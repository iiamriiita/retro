// Flat illustrations for the three retro templates. Self-contained inline SVG
// (cream rounded square + a themed motif), matching the app-icon style.
export default function TemplateIcon({
  id,
  size = 44,
}: {
  id: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 512 512",
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };
  const bg = <rect width="512" height="512" rx="116" fill="#FAF5EF" />;

  if (id === "sailboat") {
    return (
      <svg {...common}>
        {bg}
        <circle cx="372" cy="150" r="42" fill="#F0B90B" />
        <rect x="248" y="92" width="16" height="160" rx="8" fill="#6B4A2E" />
        <path d="M256 96 L166 250 L256 250 Z" fill="#2C1C12" />
        <path d="M256 112 L346 250 L256 250 Z" fill="#7E5232" />
        <path
          d="M104 344 C 180 336 332 336 408 344 L 372 402 C 300 412 212 412 140 402 Z"
          fill="#E0A800"
        />
        <path
          d="M150 352 q 52 20 104 8 q 58 -14 108 6 l -6 18 q -50 -16 -104 -4 q -54 12 -96 -10 z"
          fill="#F0B90B"
          opacity="0.55"
        />
        <path d="M104 344 q -26 6 -36 24 q 24 4 44 -6 z" fill="#F0B90B" />
        <path d="M408 344 q 26 6 36 24 q -24 4 -44 -6 z" fill="#F0B90B" />
      </svg>
    );
  }

  if (id === "garden") {
    return (
      <svg {...common}>
        {bg}
        <circle cx="356" cy="150" r="42" fill="#F0B90B" />
        <rect x="248" y="212" width="16" height="150" rx="4" fill="#6B4A2E" />
        <path
          d="M256 246 C 202 250 154 214 150 178 C 204 182 252 214 256 246 Z"
          fill="#F0B90B"
        />
        <path
          d="M256 236 C 300 214 348 178 352 146 C 314 148 272 188 256 236 Z"
          fill="#D9A400"
        />
        <circle cx="256" cy="250" r="18" fill="#2C1C12" />
        <path d="M196 342 L316 342 L334 408 L178 408 Z" fill="#B98C67" />
        <path d="M178 408 L334 408 L340 432 L172 432 Z" fill="#7E5232" />
      </svg>
    );
  }

  if (id === "space-mission") {
    return (
      <svg {...common}>
        {bg}
        <path
          d="M256 92 C 302 128 322 190 322 244 L 190 244 C 190 190 210 128 256 92 Z"
          fill="#EAE0D0"
        />
        <path d="M190 244 L322 244 L300 296 L212 296 Z" fill="#DDD0BB" />
        <circle cx="256" cy="198" r="30" fill="#2C1C12" />
        <path d="M198 252 L150 302 L184 334 L216 288 Z" fill="#7E5232" />
        <path d="M314 252 L362 302 L328 334 L296 288 Z" fill="#7E5232" />
        <path d="M224 300 L288 300 L256 402 Z" fill="#F0B90B" />
        <circle cx="256" cy="332" r="14" fill="#2C1C12" />
      </svg>
    );
  }

  return null;
}
