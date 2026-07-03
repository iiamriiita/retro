"use client";

import { useRouter } from "next/navigation";

export default function BackButton({
  fallback = "/",
  label = "返回",
}: {
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
    >
      ← {label}
    </button>
  );
}
