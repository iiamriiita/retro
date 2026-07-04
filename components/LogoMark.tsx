// The product logo: a gold rounded square with a six-dot mark
// (five dark dots around a warm-brown centre).
export default function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="512" height="512" rx="116" fill="#F0B90B" />
      <circle cx="256" cy="256" r="40" fill="#8A5A33" />
      <circle cx="256" cy="146" r="34" fill="#2C1C12" />
      <circle cx="360" cy="222" r="34" fill="#2C1C12" />
      <circle cx="320" cy="346" r="34" fill="#2C1C12" />
      <circle cx="192" cy="346" r="34" fill="#2C1C12" />
      <circle cx="152" cy="222" r="34" fill="#2C1C12" />
    </svg>
  );
}
