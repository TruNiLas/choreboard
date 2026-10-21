"use client";

import { useEffect, useState } from "react";

// Counts from 0 to `to` once, on mount. Shows the final number straight away for people
// who prefer reduced motion, and on the server render, so the number is never missing.
export function CountUp({ to, duration = 1200, delay = 0 }: { to: number; duration?: number; delay?: number }) {
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now + delay;
      const progress = Math.min(1, Math.max(0, (now - start) / duration));
      // Ease out, so the last points land slowly like a scoreboard settling.
      setValue(Math.round(to * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration, delay]);

  return <>{value}</>;
}
