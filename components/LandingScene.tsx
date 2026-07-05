"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";

type Active = {
  who: string;
  text: string;
  x: number;
  y: number;
  place: "above" | "below";
};

// Sailboat scene. Hover an object (boat / anchor / sun) to reveal its line;
// the bubble is measured against the object's real box so it stays anchored.
export default function LandingScene() {
  const { t } = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Active | null>(null);

  function show(who: string, text: string) {
    return (e: React.MouseEvent<SVGGElement>) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const cr = wrap.getBoundingClientRect();
      const br = e.currentTarget.getBoundingClientRect();
      const cx = br.left - cr.left + br.width / 2;
      const topGap = br.top - cr.top;
      // Prefer sitting just above the object; flip below if there's no room.
      const place: "above" | "below" = topGap < 120 ? "below" : "above";
      const y = place === "above" ? br.top - cr.top : br.bottom - cr.top;
      const x = Math.max(140, Math.min(cr.width - 140, cx));
      setActive({ who, text, x, y, place });
    };
  }
  const clear = () => setActive(null);

  const obj = (who: string, text: string) => ({
    style: { cursor: "pointer" } as const,
    onMouseEnter: show(who, text),
    onMouseLeave: clear,
  });

  return (
    <div ref={wrapRef} className="lp-scene h-full min-h-[320px] w-full">
      <svg
        className="bg"
        viewBox="0 0 640 760"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="640" height="760" fill="#FBF6EE" />

        {/* sun */}
        <g {...obj(t("landing.bubSunWho"), t("landing.bubSunText"))}>
          <circle id="lp-sun" cx="510" cy="150" r="66" fill="#F0B90B" />
        </g>

        {/* sprout — drawn first so the waves cover its base */}
        <path d="M115 526 Q115 490 118 460 Q121 490 121 526 Z" fill="#6B4A2E" />
        <path
          d="M118 466 C114 452 116 442 118 438 C120 442 122 452 118 466 Z"
          fill="#5BA36B"
        />
        <path
          d="M117 472 C104 470 96 461 94 454 C106 454 115 463 117 472 Z"
          fill="#4E8C5A"
        />
        <path
          d="M119 470 C132 466 141 457 143 450 C131 450 121 460 119 470 Z"
          fill="#6FA972"
        />

        {/* back wave — behind the boat */}
        <path
          d="M0 500c110 30 190-14 300-14s200 32 340 12v262H0z"
          fill="#F0B90B"
        />

        {/* boat — sits in the water, between the two wave layers */}
        <g
          id="lp-boat"
          transform="translate(320,428)"
          {...obj(t("landing.bubSailWho"), t("landing.bubSailText"))}
        >
          <rect x="-80" y="-50" width="168" height="180" fill="transparent" />
          {/* mast */}
          <rect x="-3" y="-48" width="6" height="170" fill="#4A2F1C" />
          {/* pennant flag */}
          <path d="M4 -46h40l-10 8 10 8H4z" fill="#E5873A" />
          {/* back sail (cream, paneled) */}
          <path d="M5 -34L5 84 84 84z" fill="#EFE7D6" />
          <path d="M5 -34L5 84 30 84z" fill="#E3D7C0" />
          <path d="M60 84L5 12 5 84z" fill="#F5EEE0" opacity=".6" />
          {/* front sail (gold, two-tone) */}
          <path d="M-5 -20L-5 84-70 84z" fill="#ECC30B" />
          <path d="M-5 -20L-5 84-34 84z" fill="#D9A400" />
          {/* hull + deck rim */}
          <path d="M-80 84L86 84 62 122-58 122z" fill="#6E4A2E" />
          <path d="M-80 84L86 84 81 93-75 93z" fill="#523320" />
        </g>

        {/* mid wave — laps over the boat's hull */}
        <path d="M0 548c130 26 200-14 340-14s200 26 300 8v220H0z" fill="#E0A800" />
        {/* front wave — deepest layer */}
        <path d="M0 604c120 24 210-16 340-14s210 24 300 6v170H0z" fill="#C68F00" />

        {/* anchor */}
        <g
          transform="translate(470,610)"
          {...obj(t("landing.bubAnchorWho"), t("landing.bubAnchorText"))}
        >
          <rect x="-34" y="-58" width="68" height="120" fill="transparent" />
          <circle
            cx="0"
            cy="-42"
            r="11"
            fill="none"
            stroke="#452C1C"
            strokeWidth="8"
          />
          <rect x="-4" y="-30" width="8" height="86" rx="4" fill="#452C1C" />
          <rect x="-22" y="-14" width="44" height="8" rx="4" fill="#452C1C" />
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

      {active && (
        <div
          className="lp-bubble show"
          style={{
            left: active.x,
            top: active.y,
            transform:
              active.place === "above"
                ? "translate(-50%, calc(-100% - 12px))"
                : "translate(-50%, 12px)",
          }}
        >
          <span className="lp-who">{active.who}</span>
          {active.text}
        </div>
      )}
    </div>
  );
}
