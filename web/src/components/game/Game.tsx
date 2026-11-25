"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { frost, loadFrost } from "@/lib/frost";
import { DEFAULT_NAMES, newCeremony, type Ceremony } from "@/lib/game/engine";
import { Wordmark } from "../Logo";
import { ArrowIcon, CheckIcon } from "../icons";
import { Avatar, type LogEntry, type PushLog } from "./kit";
import { LevelCeremony } from "./LevelCeremony";
import { LevelCheater } from "./LevelCheater";
import { LevelUnlinkable } from "./LevelUnlinkable";

type Level = "setup" | "ceremony" | "cheater" | "unlinkable" | "done";
type Engine = { status: "loading" } | { status: "ready"; version: string } | { status: "error"; message: string };

export function Game() {
  const [engine, setEngine] = useState<Engine>({ status: "loading" });
  const [level, setLevel] = useState<Level>("setup");
  const [ceremony, setCeremony] = useState<Ceremony | null>(null);
  const [completed, setCompleted] = useState<Set<Level>>(new Set());
  const [log, setLog] = useState<LogEntry[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    loadFrost()
      .then(() => setEngine({ status: "ready", version: frost.version() }))
      .catch((e: unknown) => setEngine({ status: "error", message: e instanceof Error ? e.message : String(e) }));
  }, []);

  const push: PushLog = useCallback((entry) => {
    const id = nextId.current++;
    setLog((l) => [...l, { ...entry, id }]);
  }, []);

  const complete = (lvl: Level, next: Level) => {
    setCompleted((s) => new Set(s).add(lvl));
    setLevel(next);
    window.scrollTo({ top: 0 });
  };

  const ceremonyDone = !!ceremony && Object.keys(ceremony.result).length === ceremony.n;

  const reset = () => {
    setCeremony(null);
    setCompleted(new Set());
    setLog([]);
    setLevel("setup");
  };

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-glacier/10 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-5">
          <Link href="/" aria-label="Back to the Hima site">
            <Wordmark />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {ceremony && (
              <span className="chip hidden sm:inline-flex">
                hot-seat · {ceremony.t} of {ceremony.n}
              </span>
            )}
            <span className="chip" title={engine.status === "ready" ? engine.version : undefined}>
              <span
                className={`size-1.5 rounded-full ${engine.status === "ready" ? "bg-glacier pulse-dot" : engine.status === "error" ? "bg-ember" : "bg-brass"}`}
              />
              {engine.status === "ready" ? "FROST engine ready" : engine.status === "error" ? "engine failed" : "loading engine…"}
            </span>
            {ceremony && (
              <button type="button" onClick={reset} className="btn btn-ghost !h-9 !px-3.5 text-xs">
                New table
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-8 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_340px]">
        {/* Level nav */}
        <nav aria-label="Levels" className="lg:sticky lg:top-24 lg:self-start">
          <ol className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0">
            <NavItem n={0} label="Set up the table" active={level === "setup"} done={!!ceremony} onClick={() => setLevel("setup")} enabled={!ceremony} />
            <NavItem n={1} label="Key Ceremony" active={level === "ceremony"} done={completed.has("ceremony")} onClick={() => setLevel("ceremony")} enabled={!!ceremony} />
            <NavItem n={2} label="Catch the Cheater" active={level === "cheater"} done={completed.has("cheater")} onClick={() => setLevel("cheater")} enabled={ceremonyDone} />
            <NavItem n={3} label="Old Shares" note="stretch · soon" active={false} done={false} onClick={() => undefined} enabled={false} />
            <NavItem n={4} label="Unlinkable" active={level === "unlinkable"} done={completed.has("unlinkable")} onClick={() => setLevel("unlinkable")} enabled={ceremonyDone} />
          </ol>
          <p className="mt-6 hidden text-xs leading-relaxed text-moss-deep lg:block">
            Every step runs the Zcash Foundation&apos;s FROST v3 (re-randomized RedPallas) in this tab. Unaudited, demo keys
            only, no funds.
          </p>
        </nav>

        <main className="min-w-0">
          {engine.status === "error" && (
            <div className="panel !border-ember/40 p-6 text-ember">
              Couldn&apos;t load the WebAssembly engine: {engine.message}
            </div>
          )}
          {engine.status === "loading" && <p className="font-mono text-sm text-moss">› loading frost-wasm…</p>}
          {engine.status === "ready" && (
            <>
              {level === "setup" && (
                <Setup
                  onStart={(c) => {
                    setCeremony(c);
                    setLog([]);
                    push({ actor: "Table", kind: "local", text: `new ${c.t}-of-${c.n} table: ${c.players.map((p) => p.name).join(", ")}` });
                    setLevel("ceremony");
                  }}
                />
              )}
              {level === "ceremony" && ceremony && (
                <LevelCeremony ceremony={ceremony} setCeremony={setCeremony} log={push} onNext={() => complete("ceremony", "cheater")} />
              )}
              {level === "cheater" && ceremony && ceremonyDone && (
                <LevelCheater ceremony={ceremony} log={push} onNext={() => complete("cheater", "unlinkable")} />
              )}
              {level === "unlinkable" && ceremony && ceremonyDone && (
                <LevelUnlinkable ceremony={ceremony} log={push} onNext={() => complete("unlinkable", "done")} />
              )}
              {level === "done" && <Done onRestart={reset} />}
            </>
          )}
        </main>

        <ProtocolLog entries={log} />
      </div>
    </div>
  );
}

function NavItem({
  n,
  label,
  note,
  active,
  done,
  enabled,
  onClick,
}: {
  n: number;
  label: string;
  note?: string;
  active: boolean;
  done: boolean;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <li className="shrink-0">
      <button
        type="button"
        onClick={onClick}
        disabled={!enabled && !active}
        aria-current={active ? "step" : undefined}
        className={[
          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
          active
            ? "border-glacier/40 bg-glacier/10 text-bone"
            : enabled
              ? "border-transparent text-moss hover:bg-bone/5 hover:text-bone"
              : "cursor-not-allowed border-transparent text-moss-deep",
        ].join(" ")}
      >
        <span
          className={`grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[0.65rem] ${done ? "border-glacier bg-glacier text-ink" : "border-bone/20"}`}
        >
          {done ? <CheckIcon className="size-3.5" /> : n === 0 ? "◆" : n}
        </span>
        <span className="flex flex-col">
          {label}
          {note && <span className="font-mono text-[0.6rem] uppercase tracking-widest text-brass/70">{note}</span>}
        </span>
      </button>
    </li>
  );
}

function Setup({ onStart }: { onStart: (c: Ceremony) => void }) {
  const [n, setN] = useState(5);
  const [t, setT] = useState(3);
  const [names, setNames] = useState<string[]>([...DEFAULT_NAMES]);

  const setCount = (count: number) => {
    setN(count);
    setT((cur) => Math.min(Math.max(cur, 2), count));
  };

  const start = () => {
    const players = names.slice(0, n).map((name, i) => ({ index: i + 1, name: name.trim() || DEFAULT_NAMES[i] }));
    onStart(newCeremony(players, t));
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-glacier/10 pb-6">
        <p className="eyebrow">Hot-seat mode</p>
        <h1 className="display mt-2 text-[clamp(2rem,4vw,3.2rem)]">
          Set up the table. <em className="text-glacier">One screen, real cryptography.</em>
        </h1>
        <p className="mt-3 max-w-2xl text-moss">
          Gather your friends around one screen (or a projector). Each player taps their own card when it&apos;s their turn.
          Room mode, with one phone each, is next on the roadmap.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel space-y-6 p-6">
          <div>
            <p className="eyebrow">Players · n</p>
            <Segmented options={[3, 4, 5]} value={n} onChange={setCount} />
          </div>
          <div>
            <p className="eyebrow">Threshold · t</p>
            <Segmented options={Array.from({ length: n - 1 }, (_, i) => i + 2)} value={t} onChange={setT} />
            <p className="mt-3 text-sm text-moss">
              Any {t} of {n} can sign. Tip: keep t below n so the group survives one cheater.
            </p>
          </div>
        </section>

        <section className="panel space-y-3 p-6">
          <p className="eyebrow">Players</p>
          {names.slice(0, n).map((name, i) => (
            <label key={i} className="flex items-center gap-3">
              <Avatar name={name || "?"} state="done" size="sm" />
              <span className="sr-only">Player {i + 1} name</span>
              <input
                value={name}
                maxLength={16}
                onChange={(e) => setNames((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
                className="w-full rounded-lg border border-glacier/15 bg-ink px-3 py-2 text-bone outline-none focus:border-glacier/50"
              />
              <span className="font-mono text-xs text-moss-deep">#{i + 1}</span>
            </label>
          ))}
        </section>
      </div>

      <button type="button" onClick={start} className="btn btn-primary">
        Start the key ceremony <ArrowIcon />
      </button>
    </div>
  );
}

function Segmented({ options, value, onChange }: { options: number[]; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mt-3 inline-flex rounded-full border border-glacier/15 bg-ink p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`h-9 min-w-12 rounded-full px-4 font-mono text-sm transition-colors ${value === o ? "bg-glacier text-ink" : "text-moss hover:text-bone"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Done({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="panel relative overflow-hidden px-8 py-14 text-center">
      <div aria-hidden="true" className="absolute left-1/2 top-0 h-60 w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass/20 blur-[90px]" />
      <p className="eyebrow relative !text-brass">Table complete</p>
      <h1 className="display relative mx-auto mt-4 max-w-2xl text-[clamp(2.2rem,4.5vw,3.6rem)]">
        You split a key, caught a cheater, <em className="text-glacier">and vanished on-chain.</em>
      </h1>
      <ul className="relative mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
        {[
          ["Ceremony", "One key, never held whole"],
          ["Cheater", "Named by the math, not a vote"],
          ["Unlinkable", "Every signature, a fresh key"],
        ].map(([t, d]) => (
          <li key={t} className="rounded-xl border border-glacier/15 bg-ink/60 p-4">
            <p className="flex items-center gap-2 font-semibold">
              <CheckIcon className="size-4 text-glacier" /> {t}
            </p>
            <p className="mt-1 text-sm text-moss">{d}</p>
          </li>
        ))}
      </ul>
      <div className="relative mt-10 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onRestart} className="btn btn-primary">
          New table <ArrowIcon />
        </button>
        <Link href="/" className="btn btn-ghost">
          Back to the site
        </Link>
      </div>
    </div>
  );
}

const KIND: Record<LogEntry["kind"], { tag: string; cls: string }> = {
  broadcast: { tag: "→ all", cls: "text-glacier" },
  private: { tag: "🔒 1:1", cls: "text-brass" },
  local: { tag: "local", cls: "text-moss-deep" },
  coordinator: { tag: "coord", cls: "text-bone" },
  success: { tag: "✓", cls: "text-glacier" },
  failure: { tag: "✗", cls: "text-ember" },
};

function ProtocolLog({ entries }: { entries: LogEntry[] }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [entries.length]);

  const sum = (kind: LogEntry["kind"]) =>
    entries.filter((e) => e.kind === kind).reduce((acc, e) => acc + (e.bytes ?? 0), 0);

  return (
    <aside
      aria-label="Protocol log"
      className="panel flex max-h-[70vh] flex-col overflow-hidden lg:col-span-2 xl:sticky xl:top-24 xl:col-span-1 xl:max-h-[calc(100vh-8rem)] xl:self-start"
    >
      <div className="border-b border-glacier/10 p-4">
        <p className="eyebrow">Protocol log</p>
        <p className="mt-1 text-xs text-moss">Every line is a real message produced by frost-wasm.</p>
        <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-[0.65rem]">
          <div>
            <dt className="text-moss-deep">messages</dt>
            <dd className="text-bone">{entries.filter((e) => e.bytes).length}</dd>
          </div>
          <div>
            <dt className="text-moss-deep">public</dt>
            <dd className="text-glacier">{sum("broadcast") + sum("coordinator")} B</dd>
          </div>
          <div>
            <dt className="text-moss-deep">secret</dt>
            <dd className="text-brass">{sum("private")} B</dd>
          </div>
        </dl>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-4 font-mono text-[0.7rem] leading-relaxed" aria-live="polite">
        {entries.length === 0 && <p className="text-moss-deep">› nothing yet</p>}
        {entries.map((e) => (
          <p key={e.id} className="break-words">
            <span className={`mr-1.5 ${KIND[e.kind].cls}`}>[{KIND[e.kind].tag}]</span>
            <span className="text-bone">{e.actor}</span> <span className="text-moss">{e.text}</span>
            {e.bytes !== undefined && <span className="text-moss-deep"> · {e.bytes} B</span>}
          </p>
        ))}
        <div ref={end} />
      </div>
    </aside>
  );
}
