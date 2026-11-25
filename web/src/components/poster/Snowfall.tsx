import type { CSSProperties } from "react";

/** Pure-CSS drifting snow. Deterministic positions keep server and client renders identical. */
const r = (i: number, s: number) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function Snowfall({ count = 46 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const size = 1.5 + r(i, 1) * 3.5;
        return (
          <span
            key={i}
            className="snowflake"
            style={
              {
                left: `${r(i, 2) * 100}%`,
                width: size,
                height: size,
                opacity: 0.25 + r(i, 3) * 0.6,
                filter: size > 4 ? "blur(1px)" : undefined,
                "--dur": `${9 + r(i, 4) * 12}s`,
                "--delay": `${-r(i, 5) * 20}s`,
                "--drift": `${(r(i, 6) - 0.5) * 120}px`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
