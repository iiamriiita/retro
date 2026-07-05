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
    default:
      return null;
  }
}
