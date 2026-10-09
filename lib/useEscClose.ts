"use client";

import { useEffect } from "react";

/** Close an overlay (modal / menu / popover) on Escape while `active`. */
export default function useEscClose(active: boolean, close: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close]);
}
