"use client";

/**
 * "Try the rule": an interactive illustration of the t-of-n threshold rule and
 * of cheater detection. It's deliberately labelled as an illustration: no
 * cryptography runs on the landing page. The game itself runs real FROST.
 */

import { useMemo, useState } from "react";
import { AlertIcon, CheckIcon } from "./icons";

const PLAYERS = ["Asha", "Kabir", "Meera", "Rohan", "Zoya"] as const;
const SIZE = 360;
const CENTER = SIZE / 2;
const ORBIT = 138;

type Outcome =
  | { kind: "waiting"; need: number }
  | { kind: "valid"; signers: string[] }
  | { kind: "cheater"; culprit: string };

export function ThresholdDemo() {
  const [threshold, setThreshold] = useState(3);
  const [approved, setApproved] = useState<number[]>([]);
  const [cheater, setCheater] = useState<number | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const points = useMemo(
    () =>
      PLAYERS.map((_, i) => {
        const a = (-90 + i * 72) * (Math.PI / 180);
        return { x: CENTER + ORBIT * Math.cos(a), y: CENTER + ORBIT * Math.sin(a) };
      }),
    [],
  );

  const outcome: Outcome = useMemo(() => {
    if (approved.length < threshold) return { kind: "waiting", need: threshold - approved.length };
    if (cheater !== null && approved.includes(cheater)) return { kind: "cheater", culprit: PLAYERS[cheater] };
    return { kind: "valid", signers: approved.map((i) => PLAYERS[i]) };
  }, [approved, threshold, cheater]);

  const toggle = (i: number) => {
    const next = approved.includes(i) ? approved.filter((p) => p !== i) : [...approved, i];
    setApproved(next);
    if (next.length >= threshold && cheater !== null && next.includes(cheater)) {
      setShakeKey((k) => k + 1); // re-mount the result panel to replay the shake
    }
  };

  const reset = () => setApproved([]);

  const ringColor =
    outcome.kind === "valid" ? "#e8b65a" : outcome.kind === "cheater" ? "#ff7a45" : "#9fe7d4";

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
      {/* Controls */}
      <div className="order-2 lg:order-1">
        <fieldset>
          <legend className="eyebrow">Threshold · t of 5</legend>
          <div className="mt-3 inline-flex rounded-full border border-glacier/15 bg-ink p-1">
            {[2, 3, 4, 5].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setThreshold(t)}
                aria-pressed={threshold === t}
                className={[
                  "h-9 min-w-12 rounded-full px-4 font-mono text-sm transition-colors",
                  threshold === t ? "bg-glacier text-ink" : "text-moss hover:text-bone",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="eyebrow !text-ember">Plant a cheater</legend>
          <p className="mt-2 text-sm text-moss">
            Pick a player who will secretly submit a corrupted signature share.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCheater(null)}
              aria-pressed={cheater === null}
              className={[
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                cheater === null
                  ? "border-bone/40 bg-bone/10 text-bone"
                  : "border-bone/10 text-moss hover:text-bone",
              ].join(" ")}
            >
              Nobody
            </button>
            {PLAYERS.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setCheater(i)}
                aria-pressed={cheater === i}
                className={[
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  cheater === i
                    ? "border-ember/60 bg-ember/15 text-ember"
                    : "border-bone/10 text-moss hover:text-bone",
                ].join(" ")}
              >
                {name}
              </button>
            ))}
          </div>
        </fieldset>

        <div
          key={shakeKey}
          className={[
            "panel mt-8 p-5 transition-colors duration-500",
            outcome.kind === "cheater" ? "shake !border-ember/40" : "",
            outcome.kind === "valid" ? "!border-brass/40" : "",
          ].join(" ")}
          role="status"
          aria-live="polite"
        >
          {outcome.kind === "waiting" && (
            <>
              <p className="font-mono text-xs uppercase tracking-widest text-moss-deep">aggregate()</p>
              <p className="mt-2 text-lg text-bone">
                Waiting for {outcome.need} more {outcome.need === 1 ? "signature share" : "signature shares"}.
              </p>
              <p className="mt-1 text-sm text-moss">
                Tap players on the ring. Fewer than {threshold} shares can&apos;t sign anything, and
                they learn nothing about the key.
              </p>
            </>
          )}
          {outcome.kind === "valid" && (
            <>
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brass">
                <CheckIcon /> signature valid
              </p>
              <p className="mt-2 text-lg text-bone">
                {outcome.signers.join(", ")} produced one signature for the group key.
              </p>
              <p className="mt-1 text-sm text-moss">
                It verifies like an ordinary single-signer signature. Nobody ever held the full key.
              </p>
            </>
          )}
          {outcome.kind === "cheater" && (
            <>
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ember">
                <AlertIcon /> aggregation failed · culprit identified
              </p>
              <p className="mt-2 text-lg text-bone">
                Invalid signature share from <span className="text-ember">{outcome.culprit}</span>.
              </p>
              <p className="mt-1 text-sm text-moss">
                FROST checks every share before combining them, so it names exactly who cheated. The
                group drops them and signs again without them.
              </p>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={reset} className="text-sm text-moss underline-offset-4 hover:text-bone hover:underline">
            Reset round
          </button>
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-moss-deep">
            illustration · the game runs real FROST
          </span>
        </div>
      </div>

      {/* Ring */}
      <div className="order-1 flex justify-center lg:order-2">
        <div className="relative aspect-square" style={{ width: `min(${SIZE}px, 100%)` }}>
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="absolute inset-0 size-full"
            aria-hidden="true"
          >
            <circle cx={CENTER} cy={CENTER} r={ORBIT} fill="none" stroke="#9fe7d4" strokeOpacity="0.14" />
            <circle
              cx={CENTER}
              cy={CENTER}
              r={ORBIT + 26}
              fill="none"
              stroke="#9fe7d4"
              strokeOpacity="0.06"
              strokeDasharray="2 8"
            />
            {points.map((p, i) => {
              const on = approved.includes(i);
              const bad = on && cheater === i && outcome.kind === "cheater";
              return (
                <line
                  key={i}
                  x1={p.x}
                  y1={p.y}
                  x2={CENTER}
                  y2={CENTER}
                  stroke={bad ? "#ff7a45" : "#9fe7d4"}
                  strokeOpacity={on ? 0.75 : 0.08}
                  strokeWidth={on ? 1.6 : 1}
                  strokeDasharray={bad ? "4 5" : undefined}
                  style={{ transition: "stroke-opacity .5s, stroke .5s" }}
                />
              );
            })}
            {/* progress arc around the key */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={54}
              fill="none"
              stroke="#9fe7d4"
              strokeOpacity="0.1"
              strokeWidth="4"
            />
            <circle
              cx={CENTER}
              cy={CENTER}
              r={54}
              fill="none"
              stroke={ringColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={2 * Math.PI * 54 * (1 - Math.min(approved.length / threshold, 1))}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
              style={{ transition: "stroke-dashoffset .6s cubic-bezier(.16,1,.3,1), stroke .4s" }}
            />
          </svg>

          {/* Group key */}
          <div
            className="absolute left-1/2 top-1/2 grid size-[88px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink-3 text-center"
            style={{
              boxShadow: `0 0 60px -10px ${ringColor}66, inset 0 1px 0 rgb(238 233 223 / 0.08)`,
              transition: "box-shadow .5s",
            }}
          >
            <div>
              <div className="font-mono text-xl font-semibold text-bone">
                {Math.min(approved.length, 5)}/{threshold}
              </div>
              <div className="font-mono text-[0.58rem] uppercase tracking-widest text-moss">group key</div>
            </div>
          </div>

          {/* Players */}
          {PLAYERS.map((name, i) => {
            const on = approved.includes(i);
            const isCheater = cheater === i;
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={on}
                aria-label={`${on ? "Withdraw" : "Add"} ${name}'s signature share`}
                className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
                style={{ left: `${(points[i].x / SIZE) * 100}%`, top: `${(points[i].y / SIZE) * 100}%` }}
              >
                <span
                  className={[
                    "grid size-14 place-items-center rounded-2xl border text-base font-semibold transition-all duration-300",
                    on
                      ? isCheater && outcome.kind === "cheater"
                        ? "border-ember bg-ember text-ink"
                        : "border-glacier bg-glacier text-ink shadow-[0_0_30px_-6px_#9fe7d4]"
                      : "border-glacier/20 bg-ink-2 text-moss group-hover:border-glacier/50 group-hover:text-bone",
                    "group-active:scale-95",
                  ].join(" ")}
                >
                  {name[0]}
                </span>
                <span className="flex items-center gap-1 text-xs text-moss">
                  {name}
                  {isCheater && <span className="size-1.5 rounded-full bg-ember" title="secret cheater" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
