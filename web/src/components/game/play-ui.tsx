"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Friend } from "./world";

/* ---------------- Context: grown-up mode + protocol log ---------------- */

export type LogKind = "broadcast" | "private" | "local" | "coordinator" | "success" | "failure";
export type LogEntry = { id: number; actor: string; kind: LogKind; text: string; bytes?: number };
export type PushLog = (entry: Omit<LogEntry, "id">) => void;

export const GameCtx = createContext<{ grown: boolean; log: PushLog }>({ grown: false, log: () => undefined });
export const useGame = () => useContext(GameCtx);

/** Technical subtitle, visible only in grown-up mode. */
export function Tech({ children }: { children: ReactNode }) {
  const { grown } = useGame();
  if (!grown) return null;
  return <p className="mt-2 font-mono text-[0.7rem] leading-relaxed text-glacier/80">⚙ {children}</p>;
}

/* ---------------- Himu, the guide ---------------- */

export function Himu({ mood = "happy", size = 76 }: { mood?: "happy" | "wow" | "sly"; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="bob shrink-0 drop-shadow-[0_8px_20px_rgba(159,231,212,0.35)]" aria-hidden="true">
      <path d="M50 8 56 20 50 17 44 20Z" fill="#9fe7d4" />
      <path d="M40 12 46 22 40 21Z M60 12 54 22 60 21Z" fill="#9fe7d4" opacity="0.7" />
      <ellipse cx="50" cy="58" rx="36" ry="36" fill="#eef9f6" />
      <ellipse cx="50" cy="70" rx="22" ry="20" fill="#d4f3ea" />
      <circle cx="37" cy="50" r="11" fill="white" stroke="#cfe9e2" />
      <circle cx="63" cy="50" r="11" fill="white" stroke="#cfe9e2" />
      {mood === "sly" ? (
        <>
          <path d="M30 50 h14" stroke="#07110f" strokeWidth="4" strokeLinecap="round" />
          <path d="M56 50 h14" stroke="#07110f" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={mood === "wow" ? 37 : 39} cy="51" r={mood === "wow" ? 6 : 5} fill="#07110f" />
          <circle cx={mood === "wow" ? 63 : 65} cy="51" r={mood === "wow" ? 6 : 5} fill="#07110f" />
          <circle cx="41" cy="49" r="1.8" fill="white" />
          <circle cx="67" cy="49" r="1.8" fill="white" />
        </>
      )}
      <path d={mood === "wow" ? "M46 62 54 62 50 70Z" : "M45 61 55 61 50 67Z"} fill="#ff9a5c" />
      <circle cx="28" cy="62" r="4" fill="#ffb3a0" opacity="0.5" />
      <circle cx="72" cy="62" r="4" fill="#ffb3a0" opacity="0.5" />
    </svg>
  );
}

/** Himu says one thing at a time. */
export function Narrator({
  children,
  tech,
  mood,
}: {
  children: ReactNode;
  tech?: ReactNode;
  mood?: "happy" | "wow" | "sly";
}) {
  return (
    <div className="flex items-end gap-3 sm:gap-4">
      <Himu mood={mood} />
      <div className="pop-in relative flex-1 rounded-3xl rounded-bl-md border border-glacier/20 bg-bone px-5 py-4 text-ink shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
        <div className="text-[1.05rem] leading-snug font-medium sm:text-lg">{children}</div>
        {tech && (
          <div className="[&_p]:!text-ink/60">
            <Tech>{tech}</Tech>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Buttons ---------------- */

export function BigButton({
  children,
  onClick,
  disabled,
  tone = "glacier",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "glacier" | "brass" | "ember";
}) {
  const tones = {
    glacier: "bg-glacier text-ink shadow-[0_8px_0_#3fb79b,0_20px_40px_-10px_rgba(159,231,212,0.6)]",
    brass: "bg-brass text-ink shadow-[0_8px_0_#b88a32,0_20px_40px_-10px_rgba(232,182,90,0.6)]",
    ember: "bg-ember text-ink shadow-[0_8px_0_#c24a18,0_20px_40px_-10px_rgba(255,122,69,0.6)]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-14 rounded-2xl px-8 text-lg font-bold tracking-tight transition-transform active:translate-y-[6px] active:shadow-none disabled:pointer-events-none disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

/* ---------------- The round table ---------------- */

export type Seat = {
  index: number;
  friend: Friend;
  state?: "idle" | "active" | "done" | "picked" | "bad" | "dim";
  badge?: ReactNode;
  below?: ReactNode;
  onClick?: () => void;
  hint?: boolean;
};

const seatPos = (i: number, n: number) => {
  const a = (-90 + (i * 360) / n) * (Math.PI / 180);
  return { x: 50 + 38 * Math.cos(a), y: 50 + 38 * Math.sin(a) };
};

export function RoundTable({
  seats,
  center,
  links = [],
}: {
  seats: Seat[];
  center?: ReactNode;
  /** Animated lines between seat indices (positions in `seats`). */
  links?: [number, number][];
}) {
  const pos = seats.map((_, i) => seatPos(i, seats.length));
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(460px,64vh)]">
      <div className="absolute inset-[16%] rounded-full border border-glacier/15 bg-[radial-gradient(circle,rgb(159_231_212/0.10),transparent_70%)]" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        {links.map(([a, b], k) => (
          <line
            key={k}
            x1={pos[a].x}
            y1={pos[a].y}
            x2={pos[b].x}
            y2={pos[b].y}
            stroke={seats[a].friend.color}
            strokeWidth="0.7"
            strokeOpacity="0.8"
            className="march"
          />
        ))}
      </svg>
      <div className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center">{center}</div>
      {seats.map((s, i) => (
        <div
          key={s.index}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${pos[i].x}%`, top: `${pos[i].y}%` }}
        >
          <FriendToken seat={s} />
        </div>
      ))}
    </div>
  );
}

export function FriendToken({ seat }: { seat: Seat }) {
  const { friend, state = "idle", badge, below, onClick, hint } = seat;
  const ring =
    state === "bad"
      ? "#ff7a45"
      : state === "dim"
        ? "rgb(238 233 223 / 0.1)"
        : state === "idle"
          ? "rgb(238 233 223 / 0.25)"
          : friend.color;
  const body = (
    <>
      <span
        className={`relative grid size-14 place-items-center rounded-full border-[3px] bg-ink-2 text-3xl transition-all duration-300 sm:size-16 sm:text-4xl ${hint ? "tap-hint" : ""} ${state === "dim" ? "opacity-40 grayscale" : ""} ${state === "bad" ? "wiggle" : ""}`}
        style={{ borderColor: ring, boxShadow: state === "done" || state === "picked" ? `0 0 24px -4px ${friend.color}` : undefined }}
      >
        {friend.emoji}
        {badge && <span className="pop-in absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-ink text-base shadow-lg ring-2 ring-ink-3">{badge}</span>}
      </span>
      <span className="mt-1 block text-center text-xs font-semibold text-bone sm:text-sm">{friend.name}</span>
      {below && <span className="mt-1 flex justify-center">{below}</span>}
      {hint && !below && (
        <span className="mt-1 rounded-full bg-bone px-2 py-0.5 text-[0.65rem] font-bold text-ink">👆 tap me</span>
      )}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="flex flex-col items-center transition-transform hover:scale-105 active:scale-95" aria-label={friend.name}>
      {body}
    </button>
  ) : (
    <div className="flex flex-col items-center">{body}</div>
  );
}

/** Layout for one scene: guide on top, stage in the middle, one big action below. */
export function Scene({ narrator, stage, action }: { narrator: ReactNode; stage: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {narrator}
      <div className="rounded-[2rem] border border-glacier/10 bg-ink-2/60 p-4 sm:p-6">{stage}</div>
      {action && <div className="flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}
