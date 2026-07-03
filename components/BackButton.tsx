"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useT } from "@/lib/i18n/client";

export default function BackButton({
  fallback = "/",
  label,
}: {
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();
  const { t } = useT();
  const text = label ?? t("common.back");
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
      <Icon name="arrow-left" size={15} />
      {text}
    </button>
  );
}
