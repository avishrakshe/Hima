"use client";

/** Small shared UI pieces for the game screens. */

import type { ReactNode } from "react";
import { CheckIcon } from "../icons";

export type LogKind = "broadcast" | "private" | "local" | "coordinator" | "success" | "failure";

export type LogEntry = {
  id: number;
  actor: string;
  kind: LogKind;
  text: string;
  bytes?: number;
};

export type PushLog = (entry: Omit<LogEntry, "id">) => void;

export function Avatar({
  name,
  state = "idle",
  size = "md",
}: {
  name: string;
  state?: "idle" | "active" | "done" | "bad" | "dim";
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "size-8 text-xs rounded-lg", md: "size-11 text-sm rounded-xl", lg: "size-14 text-base rounded-2xl" };
  const states = {
    idle: "border-glacier/20 bg-ink-2 text-moss",
    active: "border-glacier/70 bg-ink-3 text-glacier pulse-dot",
    done: "border-glacier bg-glacier text-ink",
    bad: "border-ember bg-ember text-ink",
    dim: "border-bone/10 bg-ink text-moss-deep",
  };
  return (
    <span
      className={`grid shrink-0 place-items-center border font-semibold transition-all duration-300 ${sizes[size]} ${states[state]}`}
      aria-hidden="true"
    >
      {name[0]}
    </span>
  );
}

export function HexChip({ hex, tone = "glacier", label }: { hex: string; tone?: "glacier" | "brass" | "ember" | "moss"; label?: string }) {
  const tones = {
    glacier: "border-glacier/20 text-glacier",
    brass: "border-brass/30 text-brass",
    ember: "border-ember/40 text-ember",
    moss: "border-bone/10 text-moss",
  };
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-md border bg-ink/70 px-2 py-0.5 font-mono text-[0.7rem] ${tones[tone]}`}
      title={hex}
    >
      {label && <span className="text-moss-deep">{label}</span>}
      <span className="truncate">
        {hex.length > 18 ? `${hex.slice(0, 8)}…${hex.slice(-6)}` : hex}
      </span>
    </span>
  );
}

export type Step = { key: string; label: string };

export function Stepper({ steps, current, done }: { steps: Step[]; current: number; done: boolean }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => {
        const complete = done || i < current;
        const active = !done && i === current;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                complete
                  ? "border-glacier/40 bg-glacier/10 text-glacier"
                  : active
                    ? "border-bone/30 bg-bone/5 text-bone"
                    : "border-bone/10 text-moss-deep",
              ].join(" ")}
            >
              <span className="grid size-4 place-items-center rounded-full font-mono text-[0.6rem]">
                {complete ? <CheckIcon className="size-3.5" /> : i + 1}
              </span>
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="h-px w-4 bg-bone/15" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

export function LevelHeader({
  level,
  title,
  lesson,
  children,
}: {
  level: number;
  title: ReactNode;
  lesson: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-glacier/10 pb-6">
      <div>
        <p className="eyebrow">Level {level}</p>
        <h1 className="display mt-2 text-[clamp(2rem,4vw,3.2rem)]">{title}</h1>
        <p className="mt-3 max-w-2xl text-moss">{lesson}</p>
      </div>
      {children}
    </header>
  );
}

/** "What just happened" box: plain-language explanation of the current step. */
export function Explain({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-brass/20 bg-brass/[0.04] p-5">
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-brass">{title}</p>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-bone/85">{children}</div>
    </div>
  );
}

export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="btn btn-primary disabled:pointer-events-none disabled:opacity-40">
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="btn btn-ghost disabled:pointer-events-none disabled:opacity-40">
      {children}
    </button>
  );
}

export function SimulatedTag({ children = "simulated" }: { children?: ReactNode }) {
  return (
    <span className="rounded-full border border-ember/40 bg-ember/10 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-ember">
      {children}
    </span>
  );
}
