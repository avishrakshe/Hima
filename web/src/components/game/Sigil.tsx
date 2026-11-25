"use client";

/**
 * A crystal picture drawn deterministically from a key's bytes. The same key
 * always draws the same crystal, so a child can *see* that everyone holds the
 * same team key, or that each disguise is different.
 */

import { useId } from "react";

function bytesOf(hex: string): number[] {
  const out: number[] = [];
  for (let i = 0; i + 1 < hex.length && out.length < 32; i += 2) out.push(parseInt(hex.slice(i, i + 2), 16) || 0);
  while (out.length < 32) out.push(out.length * 37);
  return out;
}

export function Sigil({ hex, size = 72, className = "" }: { hex: string; size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const b = bytesOf(hex);
  const points = 5 + (b[0] % 4); // 5..8 facets
  const hue = Math.round((b[1] / 255) * 360);
  const hue2 = (hue + 40 + (b[2] % 80)) % 360;
  const rot = (b[3] / 255) * 360;

  const outer = Array.from({ length: points }, (_, i) => {
    const a = (i / points) * Math.PI * 2 + (rot * Math.PI) / 180;
    const r = 30 + (b[4 + i] / 255) * 16;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const;
  });
  const inner = Array.from({ length: points }, (_, i) => {
    const a = ((i + 0.5) / points) * Math.PI * 2 + (rot * Math.PI) / 180;
    const r = 12 + (b[14 + i] / 255) * 12;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const;
  });
  const path = (pts: readonly (readonly [number, number])[]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label="crystal picture of a key">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 85% 78%)`} />
          <stop offset="1" stopColor={`hsl(${hue2} 70% 52%)`} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`hsl(${hue} 60% 50% / 0.12)`} />
      <polygon points={path(outer)} fill={`url(#g${id})`} stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinejoin="round" />
      {outer.map(([x, y], i) => (
        <line key={i} x1="50" y1="50" x2={x} y2={y} stroke="white" strokeOpacity="0.35" strokeWidth="0.8" />
      ))}
      <polygon points={path(inner)} fill={`hsl(${hue2} 90% 85% / 0.85)`} stroke="white" strokeOpacity="0.8" strokeWidth="0.8" />
      <circle cx={38 + (b[30] % 10)} cy={34 + (b[31] % 8)} r="3" fill="white" fillOpacity="0.8" />
    </svg>
  );
}
