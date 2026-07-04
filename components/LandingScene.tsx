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
        <g {...obj(t("landing.bubLookoutWho"), t("landing.bubLookoutText"))}>
          <circle id="lp-sun" cx="510" cy="150" r="66" fill="#F0B90B" />
        </g>

        {/* sprout — drawn first so the waves cover its base */}
        <rect x="115" y="462" width="6" height="64" fill="#7E5232" />
        <path
          d="M118 470c-12-2-20-10-20-10 10-2 20 2 20 2 0-10 8-18 8-18 4 10 0 20 0 20 10-4 20-2 20-2-6 8-18 10-18 10z"
          fill="#5BA36B"
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
          <rect x="-66" y="-8" width="132" height="140" fill="transparent" />
          <path d="M-64 92h128l-18 30h-92z" fill="#7E5232" />
          <path d="M-64 92h128l-4 6h-120z" fill="#603E27" />
          <rect x="-3" y="-4" width="7" height="96" fill="#452C1C" />
          <path d="M4 4l54 84H4z" fill="#F5ECDE" />
          <path d="M-4 12L-54 88H-4z" fill="#F0B90B" />
        </g>

        {/* front wave — laps over the boat's hull */}
        <path d="M0 552c130 26 200-14 340-14s200 26 300 8v214H0z" fill="#D9A400" />

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
