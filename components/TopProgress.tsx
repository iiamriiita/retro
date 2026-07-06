"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// A thin gold progress bar pinned to the top of the viewport that runs during
// client-side route changes. Starts on internal link clicks and completes when
// the pathname changes. No external dependency.
export default function TopProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const first = useRef(true);

  function clearTimers() {
    if (trickle.current) {
      clearInterval(trickle.current);
      trickle.current = null;
    }
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  function start() {
    clearTimers();
    setVisible(true);
    setProgress(8);
    trickle.current = window.setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(0.4, (90 - p) * 0.08) : p));
    }, 200);
    // Failsafe: never hang the bar if a navigation is cancelled.
    timers.current.push(window.setTimeout(() => finish(), 10000));
  }

  function finish() {
    clearTimers();
    setProgress(100);
    timers.current.push(window.setTimeout(() => setVisible(false), 250));
    timers.current.push(window.setTimeout(() => setProgress(0), 500));
  }

  // Complete the bar whenever the route settles on a new pathname.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Start on internal, unmodified left-clicks of same-origin links.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (a.getAttribute("target") === "_blank" || a.hasAttribute("download"))
        return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      )
        return;
      start();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimers(), []);

  if (!visible && progress === 0) return null;
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "var(--accent)",
          boxShadow: "0 0 8px var(--accent), 0 0 4px var(--accent)",
          borderRadius: "0 2px 2px 0",
          opacity: visible ? 1 : 0,
          transition: "width 0.2s ease, opacity 0.3s ease",
        }}
      />
    </div>
  );
}
