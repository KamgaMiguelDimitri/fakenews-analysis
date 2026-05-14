"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  label: string;
  value: number;
  color?: string;
  suffix?: string;
  decimals?: number;
}

export default function KpiCard({ label, value, color = "#00e5ff", suffix = "", decimals = 0 }: Props) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const from = 0;
    const to = value;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="font-mono text-2xl font-bold" style={{ color }}>
        {display.toFixed(decimals)}{suffix}
      </div>
      <div className="text-slate-500 text-xs mt-1 font-sans">{label}</div>
    </div>
  );
}
