"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";

// Sailboat scene with speech bubbles that cycle through the crew, one at a time.
// Ported from the Team Retro landing design.
export default function LandingScene() {
  const { t } = useT();

  const bubbles = [
    {
      id: "boat",
      who: t("landing.bubSailWho"),
      text: t("landing.bubSailText"),
      tail: "lp-tail-left",
      pos: { left: "36%", top: "22%" } as const,
    },
    {
      id: "anchor",
      who: t("landing.bubAnchorWho"),
      text: t("landing.bubAnchorText"),
      tail: "lp-tail-left",
      pos: { left: "52%", top: "52%" } as const,
    },
    {
      id: "lookout",
      who: t("landing.bubLookoutWho"),
      text: t("landing.bubLookoutText"),
      tail: "lp-tail-right",
      pos: { right: "8%", top: "8%" } as const,
    },
    {
      id: "helm",
      who: t("landing.bubHelmWho"),
      text: t("landing.bubHelmText"),
      tail: "lp-tail-left",
      pos: { left: "14%", top: "56%" } as const,
    },
  ];

  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Fade the first one in after a beat.
    timers.push(setTimeout(() => setShown(true), 380));
    const iv = setInterval(() => {
      setShown(false); // fade current out
      timers.push(
        setTimeout(() => {
          setActive((i) => (i + 1) % bubbles.length);
          setShown(true); // fade next in
        }, 380),
      );
    }, 3000);
    return () => {
      clearInterval(iv);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubbles.length]);

  return (
    <div className="lp-scene h-full min-h-[320px] w-full">
      <svg
        className="bg"
        viewBox="0 0 640 760"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="640" height="760" fill="#FBF6EE" />
        <circle id="lp-sun" cx="510" cy="150" r="66" fill="#F0B90B" />
        {/* water */}
        <path
          d="M0 500c110 30 190-14 300-14s200 32 340 12v262H0z"
          fill="#F0B90B"
          opacity=".9"
        />
        <path d="M0 552c130 26 200-14 340-14s200 26 300 8v214H0z" fill="#D9A400" />
        {/* small island */}
        <path d="M90 500c16-11 44-11 60 0z" fill="#7E5232" />
        <rect x="117" y="480" width="5" height="22" fill="#7E5232" />
        <path
          d="M120 480c-11-2-18-9-18-9 9-2 18 2 18 2 0-9 7-16 7-16 4 9 0 18 0 18 9-4 18-2 18-2-5 7-16 9-16 9z"
          fill="#5BA36B"
        />
        {/* boat */}
        <g id="lp-boat" transform="translate(330,300)">
          <path d="M-64 92h128l-18 30h-92z" fill="#7E5232" />
          <path d="M-64 92h128l-4 6h-120z" fill="#603E27" />
          <rect x="-3" y="-4" width="7" height="96" fill="#452C1C" />
          <path d="M4 4l54 84H4z" fill="#F5ECDE" />
          <path d="M-4 12L-54 88H-4z" fill="#F0B90B" />
        </g>
        {/* anchor */}
        <g id="anchor" transform="translate(470,560)">
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

      {bubbles.map((b, i) => (
        <div
          key={b.id}
          className={`lp-bubble ${b.tail} ${i === active && shown ? "show" : ""}`}
          style={b.pos}
        >
          <span className="lp-who">{b.who}</span>
          {b.text}
        </div>
      ))}
    </div>
  );
}
