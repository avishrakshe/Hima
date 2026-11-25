"use client";

/**
 * Level 4 · Disguise Party  (re-randomized FROST / unlinkability)
 *   team crystal = group verifying key
 *   disguise     = the one-time randomized key (group key + α·G) each signature verifies under
 *   spy game     = real disguises from your team mixed with real ones from a stranger team
 *                  (a second, independent FROST group run in this tab)
 */

import { useState } from "react";
import { frost, textToHex } from "@/lib/frost";
import { groupKey, signAll, verify, type Attempt, type Ceremony } from "@/lib/game/engine";
import { sfx } from "./fx";
import { BigButton, Narrator, RoundTable, Scene, Tech, useGame, type Seat } from "./play-ui";
import { Sigil } from "./Sigil";
import { friendOf, LETTER } from "./world";

type Step = "intro" | "one" | "two" | "spy" | "reveal";
type Mask = { hex: string; ours: boolean };

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  const r = new Uint32Array(a.length);
  crypto.getRandomValues(r);
  for (let i = a.length - 1; i > 0; i--) {
    const j = r[i] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function LevelDisguise({ ceremony: c, onDone }: { ceremony: Ceremony; onDone: (stars: number) => void }) {
  const { log, grown } = useGame();
  const [step, setStep] = useState<Step>("intro");
  const [sigs, setSigs] = useState<Attempt[]>([]);
  const [masks, setMasks] = useState<Mask[]>([]);
  const [picks, setPicks] = useState<number[]>([]);
  const gk = groupKey(c)!;
  const msg = textToHex(LETTER);
  const indices = c.players.map((p) => p.index);
  const name = (i: number) => friendOf(i, c.players.find((p) => p.index === i)?.name).name;

  const signLetter = () => {
    // Letter 1 by the first t friends, letter 2 by the last t (a different group when n > t).
    const signers = sigs.length === 0 ? indices.slice(0, c.t) : indices.slice(-c.t);
    const a = signAll(c, signers, msg);
    if (!a.outcome?.ok) return;
    log({ actor: "Coordinator", kind: "success", text: `letter #${sigs.length + 1} signed by ${signers.map(name).join(", ")} under one-time key ${a.outcome.randomized_key!.slice(0, 12)}…` });
    setSigs((s) => [...s, a]);
    sfx("magic");
    setStep(sigs.length === 0 ? "one" : "two");
  };

  const startSpy = () => {
    // A completely separate team runs its own real FROST game; we borrow its two disguises.
    const stranger = frost.selfTest(3, 2);
    log({ actor: "Stranger team", kind: "local", text: "independent 2-of-3 group signed two letters" });
    setMasks(
      shuffle<Mask>([
        { hex: sigs[0].outcome!.randomized_key!, ours: true },
        { hex: sigs[1].outcome!.randomized_key!, ours: true },
        { hex: stranger.randomized_key_1, ours: false },
        { hex: stranger.randomized_key_2, ours: false },
      ]),
    );
    setPicks([]);
    sfx("whoosh");
    setStep("spy");
  };

  const pick = (k: number) => {
    if (step !== "spy") return;
    sfx("tap");
    setPicks((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k].slice(-2)));
  };

  const reveal = () => {
    setStep("reveal");
    sfx(correct === 2 ? "success" : "magic");
  };
  const correct = picks.filter((k) => masks[k]?.ours).length;

  const seats: Seat[] = c.players.map((p) => ({ index: p.index, friend: friendOf(p.index, p.name), state: "done" }));

  const renderLetter = (a: Attempt, n: number) => {
    const rk = a.outcome!.randomized_key!;
    const sig = a.outcome!.signature!;
    return (
      <div key={n} className="pop-in flex flex-col items-center gap-2 rounded-3xl border border-glacier/15 bg-ink/60 p-4">
        <span className="text-sm font-bold text-bone">📜 Letter #{n}</span>
        <Sigil hex={rk} size={96} />
        <span className="rounded-full bg-glacier/10 px-3 py-0.5 text-xs font-bold text-glacier">🎭 disguise #{n}</span>
        <span className="text-xs text-moss">by {a.signers.map(name).join(", ")}</span>
        {grown && (
          <span className="text-center font-mono text-[0.62rem] leading-relaxed text-moss">
            verify(disguise) {verify(rk, msg, sig) ? "✓" : "✗"} · verify(team key) {verify(gk, msg, sig) ? "✓" : "✗"}
          </span>
        )}
      </div>
    );
  };

  const teamCrystal = (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-brass/25 bg-brass/[0.05] p-4">
      <span className="text-sm font-bold text-brass">Your team crystal</span>
      <Sigil hex={gk} size={96} />
      <span className="text-xs text-moss">the real team key</span>
    </div>
  );

  if (step === "intro")
    return (
      <Scene
        narrator={
          <Narrator tech="Plain FROST signatures all verify under the group key, so observers could link them. Re-randomized FROST makes each verify under group key + α·G instead.">
            Spies 🕵️ watch every letter that gets signed. If every letter showed your <b>team crystal</b>, they&apos;d know
            it was your team every time! So in Hima, every letter wears a <b>brand-new disguise</b> 🎭.
          </Narrator>
        }
        stage={<RoundTable seats={seats} center={<Sigil hex={gk} size={110} />} />}
        action={<BigButton onClick={signLetter}>Sign letter #1 ✍️</BigButton>}
      />
    );

  if (step === "one" || step === "two")
    return (
      <Scene
        narrator={
          <Narrator mood="wow" tech="Each signature verifies only under its own randomized key. The randomizer α is never published.">
            {step === "one" ? (
              <>
                Letter #1 is signed and wears <b>disguise #1</b>. Does it look like your team crystal? <b>Nope!</b> 🎭 But the
                magic checker still says the letter is real. ✅
              </>
            ) : (
              <>
                Letter #2 got a <b>totally different disguise</b>, even though the same team signed both! 🤯
              </>
            )}
          </Narrator>
        }
        stage={
          <div className="grid gap-4 sm:grid-cols-3">
            {teamCrystal}
            {sigs.map((a, i) => renderLetter(a, i + 1))}
            {sigs.length === 1 && (
              <div className="grid place-items-center rounded-3xl border border-dashed border-bone/15 p-4 text-sm text-moss-deep">
                letter #2 goes here
              </div>
            )}
          </div>
        }
        action={
          step === "one" ? (
            <BigButton onClick={signLetter}>Sign letter #2 ✍️</BigButton>
          ) : (
            <BigButton tone="ember" onClick={startSpy}>Now YOU be the spy 🕵️</BigButton>
          )
        }
      />
    );

  // spy + reveal
  return (
    <Scene
      narrator={
        <Narrator
          mood={step === "reveal" ? "wow" : "sly"}
          tech="Two randomized keys come from your group, two from an independent group. Without α, they are indistinguishable random points."
        >
          {step === "spy" ? (
            <>
              You&apos;re the spy now 🕵️! <b>Two</b> of these disguises are from <b>your team</b>, two are from a{" "}
              <b>stranger team</b>. Tap the two you think are <b>yours</b>.
            </>
          ) : (
            <>
              You found <b>{correct} of 2</b>.{" "}
              {correct === 2 ? "Lucky guess! 🍀" : "See? Even a spy can't tell! 🙈"} The disguises look totally random, so
              nobody can tell which team signed which letter. <b>That&apos;s privacy!</b>
            </>
          )}
        </Narrator>
      }
      stage={
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {masks.map((m, k) => {
            const on = picks.includes(k);
            const shown = step === "reveal";
            return (
              <button
                key={k}
                type="button"
                onClick={() => pick(k)}
                className={`flex flex-col items-center gap-2 rounded-3xl border-2 p-3 transition-all ${on ? "scale-105 border-glacier bg-glacier/10" : "border-bone/10 hover:border-bone/30"} ${shown && m.ours ? "!border-brass" : ""}`}
              >
                <Sigil hex={m.hex} size={84} />
                <span className="text-xs font-bold text-moss">
                  {shown ? (m.ours ? "⭐ your team" : "👤 stranger") : on ? "✋ my pick" : `disguise ${String.fromCharCode(65 + k)}`}
                </span>
              </button>
            );
          })}
        </div>
      }
      action={
        step === "spy" ? (
          <BigButton tone="brass" onClick={reveal} disabled={picks.length < 2}>
            {picks.length < 2 ? `Pick ${2 - picks.length} more` : "Reveal! 🔍"}
          </BigButton>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Tech>On Zcash, every Orchard spend publishes exactly this kind of one-time key (rk), so a team spend looks like anyone else&apos;s.</Tech>
            <BigButton tone="brass" onClick={() => onDone(3)}>Finish level 🏆</BigButton>
          </div>
        )
      }
    />
  );
}
