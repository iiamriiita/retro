// Brown line/flat icons shown before the Sailboat template's question labels,
// keyed by question key. Returns null for questions without a dedicated icon.
const BROWN = "#7E5232";

export default function QuestionIcon({
  qKey,
  size = 20,
}: {
  qKey: string;
  size?: number;
}) {
  const svg = (children: React.ReactNode) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {children}
    </svg>
  );

  switch (qKey) {
    case "wind": // gusts of wind
      return svg(
        <g
          stroke={BROWN}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M3 8h9a3 3 0 1 0-3-3" />
          <path d="M3 13h13.5a3 3 0 1 1-3 3" />
          <path d="M3 18h5a2.4 2.4 0 1 1-2.4 2.4" />
        </g>,
      );
    case "anchor":
      return svg(
        <g stroke={BROWN} strokeWidth="2.2" strokeLinecap="round" fill="none">
          <circle cx="12" cy="5" r="2.4" />
          <path d="M12 7.4V20" />
          <path d="M8 10.5h8" />
          <path d="M5 15c0 3.4 3 5.4 7 5.4s7-2 7-5.4" />
        </g>,
      );
    case "rocks": // mountain peaks
      return svg(
        <path
          d="M9.2 8.6 12.6 3.4a1.4 1.4 0 0 1 2.4 0l7 12.6a1.4 1.4 0 0 1-1.2 2.1H3.2a1.4 1.4 0 0 1-1.2-2.1l5.2-8.4a1.4 1.4 0 0 1 2.4 0l1 1.6z"
          fill={BROWN}
        />,
      );
    case "island": // sun on the horizon
      return svg(
        <g stroke={BROWN} strokeWidth="2.2" strokeLinecap="round" fill="none">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 3v2.2" />
          <path d="M12 18.8V21" />
          <path d="M3 12h2.2" />
          <path d="M18.8 12H21" />
          <path d="m5.6 5.6 1.6 1.6" />
          <path d="m16.8 16.8 1.6 1.6" />
          <path d="m5.6 18.4 1.6-1.6" />
          <path d="m16.8 7.2 1.6-1.6" />
        </g>,
      );
    case "liftoff": // flat rocket
      return svg(
        <g fill={BROWN}>
          <path d="M12 2c3.1 2.4 4.6 6 4.6 9.7H7.4C7.4 8 8.9 4.4 12 2Z" />
          <path d="M7.2 12.6 4 15.4l1 3.6 3.4-3.2z" />
          <path d="M16.8 12.6 20 15.4l-1 3.6-3.4-3.2z" />
          <path d="M9.9 13h4.2L12 19.5z" />
          <circle cx="12" cy="8.6" r="2.3" fill="#FAF4EA" />
        </g>,
      );
    case "gravity": // ringed planet
      return svg(
        <g>
          <circle cx="12" cy="12" r="6" fill={BROWN} />
          <path
            d="M4.3 8.9C2.2 9.9 1.2 11.2 1.7 12.4c.8 2 5.4 2.3 10.9.7 5.4-1.6 9.7-4.3 8.9-6.3-.4-1.1-2.1-1.5-4.5-1.2"
            stroke={BROWN}
            strokeWidth="2.1"
            strokeLinecap="round"
            fill="none"
          />
        </g>,
      );
    case "alerts": // warning triangle
      return svg(
        <g>
          <path
            d="M12 3.4 22 20H2Z"
            fill={BROWN}
            stroke={BROWN}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <rect x="10.8" y="9.2" width="2.4" height="5.6" rx="1.2" fill="#FAF4EA" />
          <circle cx="12" cy="17.2" r="1.4" fill="#FAF4EA" />
        </g>,
      );
    case "next_coordinates": // satellite dish
      return svg(
        <g fill={BROWN}>
          <g transform="rotate(-32 11 9)">
            <ellipse cx="11" cy="9" rx="7.4" ry="4.6" />
            <ellipse cx="11.6" cy="8.6" rx="4.6" ry="2" fill="#FAF4EA" />
          </g>
          <circle cx="5.2" cy="3.6" r="2.1" />
          <path d="M11.1 13.4h1.8l1.5 6.2H9.6z" />
          <rect x="8" y="19.2" width="8" height="2.4" rx="1.2" />
        </g>,
      );
    default:
      return null;
  }
}
