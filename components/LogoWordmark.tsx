// The product wordmark: "Team Retr" set in the display face, with the final
// "o" drawn as a gold speech-bubble (a ring + tail) to echo the discussion motif.
export default function LogoWordmark({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center font-display font-extrabold leading-none tracking-tight ${className}`}
      style={{ color: "var(--text)" }}
    >
      Team&nbsp;Retr
      <svg
        viewBox="0 0 104 116"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{
          height: "0.9em",
          width: "auto",
          marginLeft: "0.02em",
          verticalAlign: "-0.2em",
        }}
      >
        {/* ring (donut via even-odd) — transparent centre works on any surface */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M50 6 a42 42 0 1 0 0.01 0 Z M50 29 a19 19 0 1 1 -0.01 0 Z"
          fill="#F0B90B"
        />
        {/* speech-bubble tail off the lower-right */}
        <path d="M70 74 L100 112 L54 90 Z" fill="#F0B90B" />
      </svg>
    </span>
  );
}
