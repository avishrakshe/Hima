"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PLAYERS, THRESHOLD, type CeremonyPhase } from "./ceremony";

// three.js only loads in the browser, after the page is interactive.
const CeremonyScene = dynamic(() => import("./CeremonyScene"), {
  ssr: false,
  loading: () => <SceneGlow />,
});

function SceneGlow() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 m-auto size-72 rounded-full bg-glacier/10 blur-3xl"
    />
  );
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
const subscribeReducedMotion = (notify: () => void) => {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
};

const INITIAL: CeremonyPhase = { signers: [0, 2, 4], arrived: 0, complete: false };

export default function HeroVisual() {
  const box = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<CeremonyPhase>(INITIAL);
  const calm = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const [onScreen, setOnScreen] = useState(true);

  // Stop rendering frames when the hero is scrolled out of view.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className="absolute inset-0">
      <div
        aria-hidden="true"
        className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgb(159_231_212/0.16),transparent_65%)] blur-2xl"
      />
      <div className="absolute inset-0">
        <CeremonyScene onPhase={setPhase} calm={calm} active={onScreen} />
      </div>
      <SigningHud phase={phase} />
    </div>
  );
}

function SigningHud({ phase }: { phase: CeremonyPhase }) {
  const progress = Math.min(phase.arrived, THRESHOLD) / THRESHOLD;

  return (
    <div
      className="panel absolute bottom-4 left-4 w-[min(320px,calc(100%-2rem))] p-4 backdrop-blur-md sm:bottom-10 sm:left-2 lg:left-6"
      style={{ background: "rgb(11 25 22 / 0.72)" }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow !text-[0.62rem]">Signing round · 3 of 5</span>
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-moss-deep">
          illustration
        </span>
      </div>

      <ul className="mt-3 grid grid-cols-5 gap-1.5">
        {PLAYERS.map((name, i) => {
          const order = phase.signers.indexOf(i);
          const arrived = order >= 0 && order < phase.arrived;
          const signing = order >= 0 && !arrived && !phase.complete;
          return (
            <li key={name} className="flex flex-col items-center gap-1.5">
              <span
                className={[
                  "grid size-8 place-items-center rounded-full border text-[0.7rem] font-semibold transition-all duration-500",
                  arrived
                    ? "border-glacier bg-glacier text-ink"
                    : signing
                      ? "border-glacier/70 text-glacier pulse-dot"
                      : "border-bone/15 text-moss-deep",
                ].join(" ")}
              >
                {name[0]}
              </span>
              <span className="text-[0.62rem] text-moss">{name}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-bone/10">
        <div
          className={`h-full rounded-full transition-all duration-700 ${phase.complete ? "bg-brass" : "bg-glacier"}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <p className="mt-2.5 font-mono text-[0.7rem] text-moss">
        {phase.complete ? (
          <span className="text-brass">threshold met → one valid signature</span>
        ) : (
          <>
            collecting signature shares{" "}
            <span className="text-glacier">
              {phase.arrived}/{THRESHOLD}
            </span>
          </>
        )}
      </p>
    </div>
  );
}
