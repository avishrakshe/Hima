"use client";

/** Game feel: tiny synthesized sound effects, confetti and star rows. */

import type { CSSProperties } from "react";

/* ---------------- Sound (WebAudio, no files) ---------------- */

let ctx: AudioContext | null = null;
let muted = false;

export const setMuted = (m: boolean) => {
  muted = m;
};

type Sfx = "tap" | "whoosh" | "success" | "fail" | "star" | "magic";

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.12, slideTo?: number) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function sfx(kind: Sfx) {
  if (muted || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    switch (kind) {
      case "tap":
        tone(880, 0, 0.08, "triangle", 0.08);
        break;
      case "whoosh":
        tone(300, 0, 0.35, "sine", 0.06, 1200);
        break;
      case "magic":
        [660, 880, 1100, 1320].forEach((f, i) => tone(f, i * 0.06, 0.18, "triangle", 0.06));
        break;
      case "success":
        [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.3, "triangle", 0.1));
        break;
      case "star":
        tone(1318, 0, 0.25, "sine", 0.1);
        tone(1760, 0.08, 0.3, "sine", 0.08);
        break;
      case "fail":
        tone(220, 0, 0.35, "sawtooth", 0.06, 110);
        break;
    }
  } catch {
    // Audio is optional; ignore browsers that block it.
  }
}

/* ---------------- Confetti ---------------- */

const COLORS = ["#9fe7d4", "#e8b65a", "#ff7a45", "#9ab8ff", "#8fd694", "#eee9df"];

/** Deterministic pseudo-random so renders stay pure. */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function Confetti({ count = 70 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="confetti-piece rounded-sm"
          style={
            {
              left: `${rand(i, 1) * 100}%`,
              width: `${6 + rand(i, 2) * 8}px`,
              height: `${8 + rand(i, 3) * 10}px`,
              background: COLORS[i % COLORS.length],
              "--drift": `${(rand(i, 4) - 0.5) * 240}px`,
              "--spin": `${360 + rand(i, 5) * 720}deg`,
              "--dur": `${2 + rand(i, 6) * 1.6}s`,
              "--delay": `${rand(i, 7) * 0.5}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ---------------- Stars ---------------- */

export function Stars({ value, max = 3, size = "text-2xl" }: { value: number; max?: number; size?: string }) {
  return (
    <span className={`inline-flex gap-1 ${size}`} aria-label={`${value} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={i < value ? "pop-in" : "opacity-20 grayscale"}
          style={{ animationDelay: `${0.25 + i * 0.25}s` }}
        >
          ⭐
        </span>
      ))}
    </span>
  );
}
