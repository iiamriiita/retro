"use client";

import type { KeyboardEvent, ReactNode } from "react";
import Icon from "@/components/Icon";

// Single-select card for forms (design-system component #12).
// Radio semantics: click selects; selection = surface swap + check disc, never a border.
const VARIANT = {
  tile: "rounded-lg p-3",
  rich: "rounded-xl p-4",
  scale: "rounded-lg py-3",
} as const;

export default function OptionCard({
  selected,
  onSelect,
  variant = "tile",
  as = "button",
  className = "",
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  variant?: keyof typeof VARIANT;
  // The rich template card contains an inner button, so it renders as a div.
  as?: "button" | "div";
  className?: string;
  children: ReactNode;
}) {
  const base = `relative text-left transition-colors ${VARIANT[variant]} ${
    selected
      ? "bg-[color:var(--accent-weak)]"
      : "bg-[color:var(--surface-2)] hover:bg-[color:var(--surface-3)]"
  } ${className}`;

  const disc = selected && (
    <span
      className={`absolute flex items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--text-inverse)] ${
        variant === "scale" ? "right-1 top-1 h-4 w-4" : "right-2 top-2 h-5 w-5"
      }`}
    >
      <Icon name="check" size={variant === "scale" ? 10 : 12} />
    </span>
  );

  if (as === "div") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={`cursor-pointer ${base}`}
      >
        {disc}
        {children}
      </div>
    );
  }

  return (
    <button type="button" onClick={onSelect} className={base}>
      {disc}
      {children}
    </button>
  );
}
