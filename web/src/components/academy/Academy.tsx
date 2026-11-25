"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { agentById, art, type Agent } from "@/lib/agents";
import { CODEX, resetProgress, useProgress, type ProgressKey } from "@/lib/academy";
import { setMuted, sfx } from "../game/fx";
import { BigButton, GameCtx, Narrator } from "../game/play-ui";
import { BossBattle } from "./BossBattle";
import { ColourTrick } from "./ColourTrick";
import { GlassKey } from "./GlassKey";
import { SpyView } from "./SpyView";

type Screen = "hub" | "spy" | "zk" | "glass" | "boss";

const LESSONS: { id: Exclude<Screen, "hub">; n: string; title: string; teaches: string; agent: Agent["id"]; blurb: string }[] = [
  { id: "spy", n: "01", title: "The Spy's View", teaches: "Transparent vs shielded", agent: "orchard", blurb: "Send ZEC four different ways and see exactly what a spy can read." },
  { id: "zk", n: "02", title: "The Colour Trick", teaches: "Zero-knowledge proofs", agent: "hima", blurb: "Prove a secret without telling it, and unmask a faker." },
  { id: "glass", n: "03", title: "The Glass Key", teaches: "Viewing keys", agent: "warden", blurb: "Let someone check your money without letting them spend it." },
  { id: "boss", n: "04", title: "Boss: Defeat Vex", teaches: "Everything you learned", agent: "vex", blurb: "Answer right to attack. Three hearts. No mercy." },
];

export function Academy() {
  const progress = useProgress();
  const [screen, setScreen] = useState<Screen>("hub");
  const [grown, setGrown] = useState(false);
  const [mute, setMute] = useState(false);
  const [flipped, setFlipped] = useState<string | null>(null);
  const ctx = useMemo(() => ({ grown, log: () => undefined }), [grown]);

  const done = (["spy", "zk", "glass", "boss"] as ProgressKey[]).filter((k) => progress[k]).length;
  const cards = CODEX.filter((c) => progress[c.unlock]).length;

  const open = (s: Screen) => {
    sfx("tap");
    setScreen(s);
    window.scrollTo({ top: 0 });
  };

  return (
    <GameCtx.Provider value={ctx}>
      <div className="relative min-h-screen bg-night">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]">
          <div className="absolute inset-0 bg-[url(/art/citadel-sm.webp)] bg-cover bg-center blur-sm" />
        </div>

        <header className="sticky top-0 z-40 border-b border-white/10 bg-night/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
            <Link href="/" className="flex items-baseline gap-2" aria-label="Back to the Hima site">
              <span className="font-display text-3xl text-cream">Hima</span>
              <span className="hidden font-mono text-[0.6rem] tracking-[0.3em] text-gold sm:inline">ACADEMY</span>
            </Link>
            {screen !== "hub" && (
              <button type="button" onClick={() => open("hub")} className="font-display border border-white/15 px-3 py-1.5 text-sm tracking-wider text-cream hover:border-gold hover:text-gold">
                ← Academy
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="cut-sm bg-gold/15 px-3 py-1.5 font-display text-sm tracking-wide text-gold">{done}/4 · {cards}/{CODEX.length} cards</span>
              <button type="button" onClick={() => setMute((m) => { setMuted(!m); return !m; })} className="grid size-9 place-items-center rounded-full border border-white/15" aria-label={mute ? "Turn sound on" : "Turn sound off"}>
                {mute ? "🔇" : "🔊"}
              </button>
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/15 py-1.5 pl-3 pr-1.5 text-xs font-semibold text-cream/60">
                <span className="hidden sm:inline">Grown-up mode</span>
                <span className="sm:hidden">⚙</span>
                <input type="checkbox" className="peer sr-only" checked={grown} onChange={(e) => setGrown(e.target.checked)} />
                <span className="relative h-5 w-9 rounded-full bg-white/15 transition-colors peer-checked:bg-glacier after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-cream after:transition-transform peer-checked:after:translate-x-4" />
              </label>
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
          {screen === "hub" && (
            <div className="flex flex-col gap-10">
              <div>
                <p className="tick font-mono text-xs uppercase tracking-[0.3em] text-gold">Learn Zcash · 20 minutes</p>
                <h1 className="font-display mt-3 text-6xl text-cream sm:text-8xl">Zcash Academy</h1>
              </div>
              <Narrator>
                Welcome, cadet! I&apos;m <b>Relay</b>. Each agent will teach you one secret of <b>Zcash</b>, the money that can
                be private. Finish all three lessons, collect the <b>Codex cards</b>, then defeat <b>Vex</b> in the boss battle!
              </Narrator>

              <div className="grid gap-5 sm:grid-cols-2">
                {LESSONS.map((l) => {
                  const locked = l.id === "boss" && done < 3 && !progress.boss;
                  const complete = progress[l.id];
                  return (
                    <button
                      key={l.id}
                      type="button"
                      disabled={locked}
                      onClick={() => open(l.id)}
                      className={`cut group relative flex h-56 overflow-hidden bg-night-2 text-left transition-transform ${locked ? "cursor-not-allowed opacity-60" : "hover:-translate-y-1"}`}
                    >
                      <div className="relative w-[42%] shrink-0 overflow-hidden">
                        <Image src={art(l.agent, "sm")} alt="" fill sizes="20vw" className={`object-cover object-[50%_15%] transition-transform duration-700 group-hover:scale-110 ${locked ? "grayscale" : ""}`} />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-night-2" />
                        <span className="font-display absolute left-3 top-2 text-5xl text-gold/90">{l.n}</span>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: agentById(l.agent).color }}>
                          {l.teaches}
                        </p>
                        <h2 className="font-display mt-1 text-3xl text-cream">{l.title}</h2>
                        <p className="mt-2 text-sm text-cream/65">{l.blurb}</p>
                        <p className="mt-auto font-display text-base tracking-wide">
                          {locked ? (
                            <span className="text-cream/40">🔒 Finish lessons 1–3</span>
                          ) : complete ? (
                            <span className="text-glacier">✓ Complete · replay</span>
                          ) : (
                            <span className="text-gold">Start →</span>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Link href="/play" className="cut group flex items-center gap-5 bg-gold p-5 text-night transition-transform hover:-translate-y-1">
                <span className="font-display text-5xl">05</span>
                <span className="flex-1">
                  <span className="block font-mono text-[0.65rem] uppercase tracking-[0.2em] text-night/70">Advanced · FROST</span>
                  <span className="font-display block text-3xl">Many hands, one key: play the team game</span>
                </span>
                <span className="font-display text-2xl transition-transform group-hover:translate-x-1">→</span>
              </Link>

              {/* Codex */}
              <section>
                <div className="flex items-end justify-between gap-4">
                  <h2 className="font-display text-5xl text-cream">Zcash Codex</h2>
                  <p className="font-mono text-xs text-cream/50">{cards}/{CODEX.length} collected · tap a card to flip</p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                  {CODEX.map((c) => {
                    const owned = progress[c.unlock];
                    const isFlipped = owned && flipped === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={!owned}
                        onClick={() => { sfx("tap"); setFlipped(isFlipped ? null : c.id); }}
                        className="cut relative h-64 overflow-hidden bg-night-2 text-left"
                        aria-label={owned ? `Codex card: ${c.title}` : "Locked codex card"}
                      >
                        {!owned ? (
                          <span className="absolute inset-0 grid place-items-center">
                            <span className="font-display text-6xl text-white/10">?</span>
                          </span>
                        ) : isFlipped ? (
                          <span key="back" className="flip-in absolute inset-0 flex flex-col bg-cream p-4 text-night">
                            <span className="font-display text-xl">{c.title}</span>
                            <span className="mt-2 text-sm leading-snug text-night/80">{c.fact}</span>
                          </span>
                        ) : (
                          <span key="front" className="flip-in absolute inset-0">
                            <Image src={art(c.agent, "sm")} alt="" fill sizes="20vw" className="object-cover object-[50%_15%]" />
                            <span className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
                            <span className="font-display absolute inset-x-3 bottom-3 text-xl leading-tight text-cream">{c.title}</span>
                            <span className="absolute right-2 top-2 bg-gold px-1.5 font-display text-xs text-night">Z</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 text-center">
                  <button type="button" onClick={resetProgress} className="text-xs text-cream/40 underline-offset-4 hover:text-cream hover:underline">
                    Reset my progress
                  </button>
                </div>
              </section>
            </div>
          )}

          {screen === "spy" && <SpyView onDone={() => open("hub")} />}
          {screen === "zk" && <ColourTrick onDone={() => open("hub")} />}
          {screen === "glass" && <GlassKey onDone={() => open("hub")} />}
          {screen === "boss" && <BossBattle onDone={() => open("hub")} />}

          {screen === "hub" && done === 4 && (
            <div className="mt-10 flex justify-center">
              <BigButton tone="brass" onClick={() => open("boss")}>Rematch Vex ⚔️</BigButton>
            </div>
          )}
        </main>
      </div>
    </GameCtx.Provider>
  );
}
