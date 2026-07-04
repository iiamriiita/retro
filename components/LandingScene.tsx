"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

// Sailboat scene. Hover an object (boat / anchor / sun) to reveal its line.
export default function LandingScene() {
  const { t } = useT();
  const [hovered, setHovered] = useState<string | null>(null);

  const bubbles = [
    {
      id: "boat",
      who: t("landing.bubSailWho"),
      text: t("landing.bubSailText"),
      tail: "lp-tail-left",
      pos: { left: "30%", top: "9%" } as const,
    },
    {
      id: "anchor",
      who: t("landing.bubAnchorWho"),
      text: t("landing.bubAnchorText"),
      tail: "lp-tail-right",
      pos: { right: "10%", top: "48%" } as const,
    },
    {
      id: "sun",
      who: t("landing.bubLookoutWho"),
      text: t("landing.bubLookoutText"),
      tail: "lp-tail-right",
      pos: { right: "6%", top: "6%" } as const,
    },
  ];

  const hover = (id: string) => ({
    style: { cursor: "pointer" } as const,
    onMouseEnter: () => setHovered(id),
    onMouseLeave: () => setHovered((h) => (h === id ? null : h)),
  });

  return (
    <div className="lp-scene h-full min-h-[320px] w-full">
      <svg
        className="bg"
        viewBox="0 0 640 760"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="640" height="760" fill="#FBF6EE" />

        {/* sun */}
        <g {...hover("sun")}>
          <circle id="lp-sun" cx="510" cy="150" r="66" fill="#F0B90B" />
        </g>

        {/* water */}
        <path
          d="M0 500c110 30 190-14 300-14s200 32 340 12v262H0z"
          fill="#F0B90B"
          opacity=".9"
        />
        <path d="M0 552c130 26 200-14 340-14s200 26 300 8v214H0z" fill="#D9A400" />

        {/* small island + sprout */}
        <path d="M84 508c18-12 50-12 68 0z" fill="#7E5232" />
        <rect x="115" y="470" width="6" height="40" fill="#7E5232" />
        <path
          d="M118 470c-12-2-20-10-20-10 10-2 20 2 20 2 0-10 8-18 8-18 4 10 0 20 0 20 10-4 20-2 20-2-6 8-18 10-18 10z"
          fill="#5BA36B"
        />

        {/* boat — sits on the water */}
        <g id="lp-boat" transform="translate(320,368)" {...hover("boat")}>
          <rect x="-66" y="-8" width="132" height="140" fill="transparent" />
          <path d="M-64 92h128l-18 30h-92z" fill="#7E5232" />
          <path d="M-64 92h128l-4 6h-120z" fill="#603E27" />
          <rect x="-3" y="-4" width="7" height="96" fill="#452C1C" />
          <path d="M4 4l54 84H4z" fill="#F5ECDE" />
          <path d="M-4 12L-54 88H-4z" fill="#F0B90B" />
        </g>

        {/* anchor */}
        <g transform="translate(470,600)" {...hover("anchor")}>
          <rect x="-36" y="-52" width="72" height="116" fill="transparent" />
          <circle
            cx="0"
            cy="-34"
            r="12"
            fill="none"
            stroke="#452C1C"
            strokeWidth="8"
          />
          <rect x="-4" y="-26" width="8" height="62" rx="4" fill="#452C1C" />
          <rect x="-20" y="-16" width="40" height="8" rx="4" fill="#452C1C" />
          <path
            d="M-30 22c0 20 14 30 30 30s30-10 30-30"
            stroke="#452C1C"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M-30 22l-7 5 9 5zM30 22l7 5-9 5z" fill="#452C1C" />
        </g>

        <circle cx="150" cy="120" r="8" fill="#F0B90B" />
        <circle cx="250" cy="80" r="5" fill="#D9A400" />
      </svg>

      {bubbles.map((b) => (
        <div
          key={b.id}
          className={`lp-bubble ${b.tail} ${hovered === b.id ? "show" : ""}`}
          style={b.pos}
        >
          <span className="lp-who">{b.who}</span>
          {b.text}
        </div>
      ))}
    </div>
  );
}
