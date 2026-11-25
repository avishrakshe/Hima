"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { frost, loadFrost } from "@/lib/frost";
import { DEFAULT_NAMES, newCeremony, type Ceremony } from "@/lib/game/engine";
import { Confetti, setMuted, sfx, Stars } from "./fx";
import { LevelDisguise } from "./LevelDisguise";
import { LevelKey } from "./LevelKey";
import { LevelTrickster } from "./LevelTrickster";
import { BigButton, FriendToken, GameCtx, Guide, Narrator, Portrait, type LogEntry, type PushLog } from "./play-ui";
import { friendOf, LEVELS, type LevelId } from "./world";
import { agentById, art } from "@/lib/agents";

type Screen = "team" | "map" | LevelId;
type Engine = { status: "loading" } | { status: "ready"; version: string } | { status: "error"; message: string };

export function Game() {
  const [engine, setEngine] = useState<Engine>({ status: "loading" });
  const [screen, setScreen] = useState<Screen>("team");
  const [ceremony, setCeremony] = useState<Ceremony | null>(null);
  const [stars, setStars] = useState<Partial<Record<LevelId, number>>>({});
  const [celebrate, setCelebrate] = useState<{ level: LevelId; stars: number } | null>(null);
  const [grown, setGrown] = useState(false);
  const [mute, setMute] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
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
  const ctx = useMemo(() => ({ grown, log: push }), [grown, push]);

  const totalStars = Object.values(stars).reduce((a, b) => a + (b ?? 0), 0);
  const keyMade = !!ceremony && Object.keys(ceremony.result).length === ceremony.n;

  const finishLevel = (level: LevelId, got: number) => {
    setStars((s) => ({ ...s, [level]: Math.max(s[level] ?? 0, got) }));
    setCelebrate({ level, stars: got });
    sfx("success");
    window.setTimeout(() => sfx("star"), 600);
  };

  const newTeam = () => {
    setCeremony(null);
    setStars({});
    setLog([]);
    setScreen("team");
  };

  const toggleMute = () => {
    setMute((m) => {
      setMuted(!m);
      return !m;
    });
  };

  return (
    <GameCtx.Provider value={ctx}>
      <div className="relative min-h-screen bg-night">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]">
          <div className="absolute inset-0 bg-[url(/art/citadel-sm.webp)] bg-cover bg-center blur-sm" />
        </div>
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-night/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
            <Link href="/" className="flex items-baseline gap-2" aria-label="Back to the Hima site">
              <span className="font-display text-3xl text-cream">Hima</span>
              <span className="hidden font-mono text-[0.6rem] tracking-[0.3em] text-gold sm:inline">FROST</span>
            </Link>
            {ceremony && screen !== "team" && (
              <button type="button" onClick={() => { sfx("tap"); setScreen("map"); }} className="font-display border border-white/15 px-3 py-1.5 text-sm tracking-wider text-cream hover:border-gold hover:text-gold">
                Map
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="rounded-full bg-brass/15 px-3 py-1.5 text-sm font-bold text-brass" aria-label={`${totalStars} stars`}>
                ⭐ {totalStars}
              </span>
              <button type="button" onClick={toggleMute} className="grid size-9 place-items-center rounded-full border border-bone/15 text-base" aria-label={mute ? "Turn sound on" : "Turn sound off"}>
                {mute ? "🔇" : "🔊"}
              </button>
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-bone/15 py-1.5 pl-3 pr-1.5 text-xs font-semibold text-moss">
                <span className="hidden sm:inline">Grown-up mode</span>
                <span className="sm:hidden">⚙</span>
                <input type="checkbox" className="peer sr-only" checked={grown} onChange={(e) => setGrown(e.target.checked)} />
                <span className="relative h-5 w-9 rounded-full bg-bone/15 transition-colors peer-checked:bg-glacier after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-bone after:transition-transform peer-checked:after:translate-x-4" />
              </label>
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
          {engine.status === "loading" && (
            <div className="grid place-items-center py-24">
              <Guide mood="wow" size={96} />
              <p className="font-display mt-6 text-2xl tracking-wide text-cream">Waking up the vault…</p>
            </div>
          )}
          {engine.status === "error" && <p className="text-ember">The magic engine didn&apos;t load: {engine.message}</p>}

          {engine.status === "ready" && (
            <>
              {screen === "team" && (
                <TeamSetup
                  onStart={(c) => {
                    setCeremony(c);
                    setLog([]);
                    push({ actor: "Team", kind: "local", text: `new ${c.t}-of-${c.n} team: ${c.players.map((p) => p.name).join(", ")}` });
                    sfx("success");
                    setScreen("key");
                  }}
                />
              )}
              {screen === "map" && ceremony && (
                <LevelMap
                  stars={stars}
                  keyMade={keyMade}
                  onPick={(id) => { sfx("tap"); setScreen(id); }}
                  onNewTeam={newTeam}
                />
              )}
              {screen === "key" && ceremony && (
                <LevelKey ceremony={ceremony} setCeremony={setCeremony} onDone={(s) => finishLevel("key", s)} />
              )}
              {screen === "trickster" && ceremony && keyMade && (
                <LevelTrickster key={`t-${totalStars}`} ceremony={ceremony} onDone={(s) => finishLevel("trickster", s)} />
              )}
              {screen === "disguise" && ceremony && keyMade && (
                <LevelDisguise ceremony={ceremony} onDone={(s) => finishLevel("disguise", s)} />
              )}
            </>
          )}
        </main>

        {/* Grown-up protocol log */}
        {grown && (
          <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
            {logOpen && <ProtocolLog entries={log} version={engine.status === "ready" ? engine.version : ""} />}
            <button type="button" onClick={() => setLogOpen((o) => !o)} className="rounded-full border border-glacier/30 bg-ink-2 px-4 py-2 font-mono text-xs text-glacier shadow-lg">
              {logOpen ? "hide" : "show"} protocol log ({log.length})
            </button>
          </div>
        )}

        {celebrate && (
          <LevelComplete
            level={celebrate.level}
            stars={celebrate.stars}
            onMap={() => { setCelebrate(null); setScreen("map"); }}
            onNext={() => {
              const order: LevelId[] = ["key", "trickster", "disguise"];
              const next = order[order.indexOf(celebrate.level) + 1];
              setCelebrate(null);
              setScreen(next ?? "map");
            }}
          />
        )}
      </div>
    </GameCtx.Provider>
  );
}

/* ---------------- Team setup ---------------- */

function TeamSetup({ onStart }: { onStart: (c: Ceremony) => void }) {
  const [n, setN] = useState(5);
  const [t, setT] = useState(3);
  const [names, setNames] = useState<string[]>([...DEFAULT_NAMES]);
  const [editing, setEditing] = useState(false);

  const choose = (count: number) => {
    sfx("tap");
    setN(count);
    setT((cur) => Math.min(Math.max(cur, 2), count));
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Narrator>
        Hi, I&apos;m <b>Relay</b>, the coordinator! Let&apos;s assemble your team. Gather your friends around this screen.
        Each friend plays one <b>agent</b>.
      </Narrator>

      <section className="cut bg-night-2/90 p-6">
        <h2 className="font-display text-2xl tracking-wide text-cream">1. How many agents are playing?</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[3, 4, 5].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => choose(count)}
              aria-pressed={n === count}
              className={`cut border-2 p-4 transition-all ${n === count ? "scale-[1.03] border-gold bg-gold/10" : "border-white/10 hover:border-white/30"}`}
            >
              <span className="font-display block text-4xl text-cream">{count}</span>
              <span className="mt-2 flex justify-center -space-x-2">
                {Array.from({ length: count }, (_, i) => {
                  const f = friendOf(i + 1);
                  return <Portrait key={i} img={f.img} face={f.face} size={26} ring="#0b0f14" />;
                })}
              </span>
            </button>
          ))}
        </div>

        <h2 className="font-display mt-8 text-2xl tracking-wide text-cream">2. How many must agree to open the chest?</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {Array.from({ length: n - 1 }, (_, i) => i + 2).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { sfx("tap"); setT(k); }}
              aria-pressed={t === k}
              className={`cut-sm font-display border-2 px-5 py-3 text-lg tracking-wide transition-all ${t === k ? "scale-[1.03] border-gold bg-gold/10 text-gold" : "border-white/10 text-cream hover:border-white/30"}`}
            >
              🔑 {k} of {n}
            </button>
          ))}
        </div>
        <p className="mt-3 text-moss">
          Any <b className="text-bone">{t}</b> friends together can open it. {t - 1} alone can&apos;t.{" "}
          {t === n && <span className="text-ember">Tip: pick fewer than {n} so a cheater can&apos;t block the team!</span>}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <FriendToken seat={{ index: i + 1, friend: friendOf(i + 1, names[i]), state: "done" }} />
              {editing && (
                <input
                  value={names[i]}
                  maxLength={12}
                  aria-label={`Name for friend ${i + 1}`}
                  onChange={(e) => setNames((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
                  className="w-20 rounded-lg border border-glacier/20 bg-ink px-2 py-1 text-center text-xs text-bone outline-none focus:border-glacier"
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-center">
          <button type="button" onClick={() => setEditing((e) => !e)} className="text-sm text-moss underline-offset-4 hover:text-bone hover:underline">
            {editing ? "Done ✓" : "✏️ Use your own names"}
          </button>
        </div>
      </section>

      <div className="flex justify-center">
        <BigButton
          onClick={() =>
            onStart(newCeremony(names.slice(0, n).map((nm, i) => ({ index: i + 1, name: nm.trim() || DEFAULT_NAMES[i] })), t))
          }
        >
          Start the adventure! 🚀
        </BigButton>
      </div>
    </div>
  );
}

/* ---------------- Level map ---------------- */

function LevelMap({
  stars,
  keyMade,
  onPick,
  onNewTeam,
}: {
  stars: Partial<Record<LevelId, number>>;
  keyMade: boolean;
  onPick: (id: LevelId) => void;
  onNewTeam: () => void;
}) {
  const allDone = LEVELS.every((l) => l.id === "old" || (stars[l.id as LevelId] ?? 0) > 0);
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <Narrator mood={allDone ? "wow" : "happy"} tech="Levels map to: DKG · threshold signing with cheater detection · share refresh (not built) · re-randomized FROST.">
        {allDone ? (
          <>You finished every level! 🏆 You now know how Zcash teams share a key, catch cheaters and stay private.</>
        ) : (
          <>Pick your next adventure! Each level teaches one secret of the magic key. 🗝️</>
        )}
      </Narrator>
      <ol className="grid gap-4 sm:grid-cols-2">
        {LEVELS.map((l) => {
          const soon = l.id === "old";
          const locked = soon || (l.id !== "key" && !keyMade);
          const got = soon ? 0 : stars[l.id as LevelId] ?? 0;
          return (
            <li key={l.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => onPick(l.id as LevelId)}
                className={`cut group relative flex w-full items-center gap-4 overflow-hidden border-2 bg-night-2/90 p-5 text-left transition-all ${locked ? "cursor-not-allowed border-white/5 opacity-50 grayscale" : "border-white/10 hover:-translate-y-1 hover:border-gold/70"}`}
              >
                <span
                  className="size-20 shrink-0 bg-night bg-no-repeat transition-transform duration-500 cut-sm group-hover:scale-110"
                  style={{ backgroundImage: `url(${art(l.agent, "sm")})`, backgroundSize: "260%", backgroundPosition: agentById(l.agent).face }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-xs tracking-[0.2em] text-gold">MISSION 0{l.n}{locked ? " · LOCKED" : ""}</span>
                  <span className="font-display block text-3xl text-cream">{l.title}</span>
                  <span className="block text-sm text-moss">{soon ? "Coming soon ❄️" : l.blurb}</span>
                  {!soon && <span className="mt-1 block"><Stars value={got} size="text-base" /></span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex justify-center">
        <button type="button" onClick={onNewTeam} className="text-sm text-moss underline-offset-4 hover:text-bone hover:underline">
          Start over with a new team
        </button>
      </div>
    </div>
  );
}

/* ---------------- Level complete ---------------- */

function LevelComplete({ level, stars, onNext, onMap }: { level: LevelId; stars: number; onNext: () => void; onMap: () => void }) {
  const info = LEVELS.find((l) => l.id === level)!;
  const last = level === "disguise";
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Level complete">
      <Confetti />
      <div className="cut pop-in relative w-full max-w-md overflow-hidden bg-night-2 p-8 text-center shadow-2xl">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-48 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]">
          <div className="absolute inset-0 bg-cover bg-[50%_15%]" style={{ backgroundImage: `url(${art(info.agent, "sm")})` }} />
        </div>
        <div className="relative mx-auto mb-2 w-fit"><Guide mood="wow" size={96} /></div>
        <p className="relative font-mono text-xs uppercase tracking-[0.3em] text-gold">Mission 0{info.n} complete</p>
        <h2 className="font-display relative mt-2 text-5xl text-cream">{info.title}</h2>
        <div className="mt-4"><Stars value={stars} size="text-4xl" /></div>
        <p className="cut-sm relative mx-auto mt-5 w-fit bg-gold/15 px-4 py-1.5 font-display text-lg tracking-wide text-gold">
          Badge · {info.badge}
        </p>
        <div className="relative mt-8 flex flex-col gap-3">
          <BigButton tone="brass" onClick={onNext}>{last ? "See your trophies 🏆" : "Next level →"}</BigButton>
          <button type="button" onClick={onMap} className="text-sm text-moss hover:text-bone">Back to the map</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Protocol log (grown-up mode) ---------------- */

const KIND: Record<LogEntry["kind"], { tag: string; cls: string }> = {
  broadcast: { tag: "→ all", cls: "text-glacier" },
  private: { tag: "🔒 1:1", cls: "text-brass" },
  local: { tag: "local", cls: "text-moss-deep" },
  coordinator: { tag: "coord", cls: "text-bone" },
  success: { tag: "✓", cls: "text-glacier" },
  failure: { tag: "✗", cls: "text-ember" },
};

function ProtocolLog({ entries, version }: { entries: LogEntry[]; version: string }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [entries.length]);
  return (
    <aside aria-label="Protocol log" className="panel flex max-h-[60vh] w-[380px] max-w-full flex-col overflow-hidden">
      <div className="border-b border-glacier/10 p-3">
        <p className="eyebrow">Protocol log · real frost-wasm messages</p>
        <p className="mt-1 font-mono text-[0.6rem] text-moss-deep">{version}</p>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-3 font-mono text-[0.68rem] leading-relaxed">
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
