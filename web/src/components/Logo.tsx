/**
 * Brand mark: five shares on a ring, three of them lit, around the group key.
 * The mark *is* the 3-of-5 rule.
 */
const LIT = [0, 2, 3]; // the three shares that sign

export function LogoMark({ size = 28 }: { size?: number }) {
  const r = 11;
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (-90 + i * 72) * (Math.PI / 180);
    return { x: 16 + r * Math.cos(a), y: 16 + r * Math.sin(a) };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r={r} stroke="#9fe7d4" strokeOpacity="0.35" strokeWidth="1" />
      {LIT.map((i) => (
        <line
          key={i}
          x1={pts[i].x}
          y1={pts[i].y}
          x2="16"
          y2="16"
          stroke="#9fe7d4"
          strokeOpacity="0.55"
          strokeWidth="0.9"
        />
      ))}
      {pts.map((p, i) => {
        const lit = LIT.includes(i);
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.6"
            fill={lit ? "#9fe7d4" : "#07110f"}
            stroke="#9fe7d4"
            strokeWidth="1"
          />
        );
      })}
      <path d="M16 12.4 19.6 16 16 19.6 12.4 16Z" fill="#e8b65a" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="flex items-baseline gap-2">
        <span className="font-serif text-[22px] italic leading-none text-bone">Hima</span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-glacier">frost</span>
      </span>
    </span>
  );
}
