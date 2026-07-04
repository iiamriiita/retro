// Wide themed banner illustrations for the three retro templates. Self-contained
// inline SVG (viewBox 1200×300), recreated flat-illustration style. Rendered as a
// full-width header on the fill page and the results page.

function star(x: number, y: number, s: number, fill: string) {
  const d =
    `M${x} ${y - s} ` +
    `L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} ` +
    `L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`;
  return <path d={d} fill={fill} />;
}

export default function TemplateBanner({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 1200 300",
    width: "100%",
    preserveAspectRatio: "xMidYMid slice" as const,
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
    className: `block w-full ${className}`,
  };

  const CREAM = "#F7F0E1";
  const GOLD = "#F0B90B";
  const GOLD_DEEP = "#D9A400";
  const BROWN = "#7E5232";
  const BROWN_DARK = "#6B4A2E";
  const GREEN = "#5BA36B";
  const GREEN_DARK = "#4E8C5A";

  if (id === "sailboat") {
    return (
      <svg {...common} style={{ height: "auto", aspectRatio: "4 / 1" }}>
        <rect width="1200" height="300" fill={CREAM} />
        <circle cx="1005" cy="78" r="52" fill={GOLD} />
        <circle cx="185" cy="72" r="8" fill={GOLD} />
        <circle cx="312" cy="50" r="7" fill={GOLD} />
        {/* sprout on a little mound */}
        <path d="M120 214 q 45 -14 92 0 l 0 6 l -92 0 Z" fill="#EFE6D3" />
        <rect x="160" y="176" width="6" height="40" fill={BROWN_DARK} />
        <path d="M163 190 C 145 186 135 176 132 168 C 148 168 160 178 163 190 Z" fill={GREEN} />
        <path d="M163 184 C 181 178 191 168 194 160 C 178 160 168 172 163 184 Z" fill={GREEN_DARK} />
        {/* back wave */}
        <path
          d="M0 214 C 200 196 380 232 600 216 C 820 200 1000 230 1200 214 L1200 300 L0 300 Z"
          fill={GOLD}
        />
        {/* boat */}
        <rect x="567" y="112" width="6" height="96" fill={BROWN_DARK} />
        <path d="M567 118 L567 192 L505 192 Z" fill={GOLD} />
        <path d="M573 114 L573 192 L631 192 Z" fill="#FBF6EC" />
        <path d="M495 192 L648 192 L623 220 L520 220 Z" fill={BROWN} />
        {/* front wave */}
        <path
          d="M0 250 C 220 236 420 266 640 250 C 860 234 1040 262 1200 250 L1200 300 L0 300 Z"
          fill={GOLD_DEEP}
        />
      </svg>
    );
  }

  if (id === "garden") {
    return (
      <svg {...common} style={{ height: "auto", aspectRatio: "4 / 1" }}>
        <rect width="1200" height="300" fill={CREAM} />
        <circle cx="1035" cy="98" r="58" fill={GOLD} />
        <circle cx="186" cy="104" r="8" fill={GOLD} />
        {/* soil */}
        <rect x="0" y="212" width="1200" height="88" fill="#B07E4E" />
        <rect x="0" y="226" width="1200" height="74" fill="#8A5A34" />
        {/* sprout */}
        <rect x="208" y="150" width="6" height="64" fill={GREEN} />
        <path d="M211 168 C 191 164 180 152 177 143 C 195 143 208 155 211 168 Z" fill={GREEN} />
        <path d="M211 162 C 231 156 242 144 245 135 C 227 135 216 149 211 162 Z" fill={GREEN_DARK} />
        {/* sunflower */}
        <rect x="393" y="150" width="6" height="64" fill={GREEN} />
        <circle cx="396" cy="150" r="27" fill={GOLD} />
        <circle cx="396" cy="150" r="12" fill={BROWN} />
        {/* sprout */}
        <rect x="578" y="150" width="6" height="64" fill={GREEN} />
        <path d="M581 168 C 561 164 550 152 547 143 C 565 143 578 155 581 168 Z" fill={GREEN} />
        <path d="M581 162 C 601 156 612 144 615 135 C 597 135 586 149 581 162 Z" fill={GREEN_DARK} />
        {/* red bud */}
        <rect x="700" y="156" width="6" height="58" fill={GREEN} />
        <circle cx="703" cy="150" r="16" fill="#D5544A" />
      </svg>
    );
  }

  if (id === "space-mission") {
    return (
      <svg {...common} style={{ height: "auto", aspectRatio: "4 / 1" }}>
        <rect width="1200" height="300" fill="#2E2015" />
        {/* planet */}
        <circle cx="108" cy="252" r="96" fill={BROWN} />
        <circle cx="88" cy="232" r="16" fill={BROWN_DARK} />
        <circle cx="128" cy="282" r="12" fill={BROWN_DARK} />
        {/* stars & dots */}
        <circle cx="150" cy="70" r="5" fill={GOLD} />
        <circle cx="372" cy="52" r="5" fill={GOLD} />
        <circle cx="690" cy="100" r="5" fill={GOLD} />
        <circle cx="905" cy="58" r="4" fill={GOLD} />
        <circle cx="1100" cy="108" r="5" fill={GOLD} />
        <circle cx="835" cy="212" r="4" fill={GOLD} />
        {star(1015, 62, 16, GOLD)}
        {star(520, 190, 13, CREAM)}
        {/* rocket */}
        <path
          d="M600 92 C 632 120 640 168 640 198 L560 198 C 560 168 568 120 600 92 Z"
          fill={CREAM}
        />
        <path d="M560 198 L640 198 L632 214 L568 214 Z" fill="#E6DBC6" />
        <circle cx="600" cy="152" r="17" fill={GOLD} />
        <path d="M560 176 L538 214 L560 208 Z" fill={GOLD} />
        <path d="M640 176 L662 214 L640 208 Z" fill={GOLD} />
        <path d="M584 214 L616 214 L600 254 Z" fill="#D5544A" />
      </svg>
    );
  }

  return null;
}
