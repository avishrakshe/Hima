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

/* ---------------- Portraits ---------------- */

/** Round/cut portrait cropped from an agent's splash art. */
export function Portrait({
  img,
  face,
  size = 64,
  ring,
  shape = "round",
  className = "",
}: {
  img: string;
  face: string;
  size?: number;
  ring?: string;
  shape?: "round" | "cut";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 bg-night-2 bg-no-repeat ${shape === "round" ? "rounded-full" : "cut-sm"} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${img})`,
        backgroundSize: "300%",
        backgroundPosition: face,
        boxShadow: ring ? `0 0 0 3px ${ring}, 0 0 24px -4px ${ring}` : undefined,
      }}
    />
  );
}

/* ---------------- Relay, the guide ---------------- */

const RELAY = { img: "/art/relay-sm.webp", face: "56% 7%" };
const VEX = { img: "/art/vex-sm.webp", face: "53% 6%" };

export function Guide({ mood = "happy", size = 76 }: { mood?: "happy" | "wow" | "sly"; size?: number }) {
  const who = mood === "sly" ? VEX : RELAY;
  return (
    <span className="bob relative block shrink-0">
      <Portrait img={who.img} face={who.face} size={size} ring={mood === "sly" ? "#ff7a45" : "#f4b728"} />
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gold px-1.5 font-display text-[0.6rem] tracking-wider text-night">
        {mood === "sly" ? "VEX" : "RELAY"}
      </span>
    </span>
  );
}

/** The guide says one thing at a time. */
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
      <Guide mood={mood} />
      <div className="cut pop-in relative flex-1 bg-cream px-5 py-4 text-ink shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
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
    glacier: "bg-glacier text-night hover:bg-[#b9f3e4]",
    brass: "bg-gold text-night hover:bg-[#ffd35a]",
    ember: "bg-ember text-night hover:bg-[#ff9466]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`cut min-h-14 px-8 font-display text-xl tracking-[0.05em] uppercase transition-[transform,background-color] hover:-translate-y-0.5 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-40 ${tones[tone]}`}
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
        className={`relative grid size-16 place-items-center rounded-full border-[3px] bg-night-2 bg-no-repeat transition-all duration-300 sm:size-[4.5rem] ${hint ? "tap-hint" : ""} ${state === "dim" ? "opacity-40 grayscale" : ""} ${state === "bad" ? "wiggle" : ""}`}
        style={{
          borderColor: ring,
          backgroundImage: `url(${friend.img})`,
          backgroundSize: "300%",
          backgroundPosition: friend.face,
          boxShadow: state === "done" || state === "picked" ? `0 0 24px -4px ${friend.color}` : undefined,
        }}
      >
        {badge && <span className="pop-in absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-ink text-base shadow-lg ring-2 ring-ink-3">{badge}</span>}
      </span>
      <span className="font-display mt-1 block text-center text-sm tracking-wide text-cream sm:text-base">{friend.name}</span>
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
      <div className="cut bg-night-2/85 p-4 backdrop-blur-sm sm:p-6">{stage}</div>
      {action && <div className="flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}
