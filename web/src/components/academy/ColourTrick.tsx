"use client";

/**
 * Lesson 2 · The Colour Trick: the classic interactive zero-knowledge proof.
 * The prover claims two balls are different colours. The verifier (you) is
 * colour-blind: you secretly swap or don't, and the prover must say which.
 * An honest prover (Hima, who sees colour) is always right. A faker (Vex,
 * also colour-blind) must guess, so survives n rounds with chance (1/2)^n.
 * You end up convinced, yet never learn which ball is which: zero knowledge.
 */

import { useRef, useState } from "react";
import { agentById, art } from "@/lib/agents";
import { completeLesson } from "@/lib/academy";
import { sfx } from "../game/fx";
import { BigButton, Narrator, Portrait, Tech } from "../game/play-ui";

type Prover = "hima" | "vex";
const coin = () => {
  const b = new Uint8Array(1);
  crypto.getRandomValues(b);
  return (b[0] & 1) === 1;
};

export function ColourTrick({ onDone }: { onDone: () => void }) {
  const [prover, setProver] = useState<Prover>(() => "hima");
  const [started, setStarted] = useState(false);
  const [swapped, setSwapped] = useState(false); // visual order of the balls
  const [phase, setPhase] = useState<"ready" | "hidden" | "answered">("ready");
  const [lastSwap, setLastSwap] = useState(false);
  const [lastAnswer, setLastAnswer] = useState(false);
  const [streak, setStreak] = useState(0);
  const [caught, setCaught] = useState(false);
  const [verdict, setVerdict] = useState<Prover | null>(null);
  const [won, setWon] = useState(false);
  const timer = useRef<number | null>(null);

  const start = () => {
    setProver(coin() ? "hima" : "vex");
    setStarted(true);
    setStreak(0);
    setCaught(false);
    setVerdict(null);
    setPhase("ready");
    sfx("magic");
  };

  const challenge = (swap: boolean) => {
    if (phase === "hidden" || caught || verdict) return;
    sfx("whoosh");
    setLastSwap(swap);
    setPhase("hidden");
    if (swap) setSwapped((s) => !s);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const answer = prover === "hima" ? swap : coin();
      setLastAnswer(answer);
      setPhase("answered");
      if (answer === swap) {
        setStreak((n) => n + 1);
        sfx("tap");
      } else {
        setCaught(true);
        sfx("fail");
      }
    }, 900);
  };

  const declare = (v: Prover) => {
    setVerdict(v);
    const right = v === prover;
    sfx(right ? "success" : "fail");
    if (right) {
      setWon(true);
      completeLesson("zk");
    }
  };

  const luck = 2 ** streak;
  const hima = agentById("hima");
  const vex = agentById("vex");
  const revealed = verdict !== null || caught;

  if (!started)
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Narrator who="hima" tech="This is the classic interactive proof of knowledge (the 'colour-blind friend' example). Zcash uses non-interactive zk-SNARKs, but the idea is the same: soundness by repetition, and zero knowledge.">
          I have two snowballs: one <b className="text-[#c98f0e]">gold</b>, one <b className="text-[#2a9d84]">ice-blue</b>. But you&apos;re{" "}
          <b>colour-blind</b> today, so they look the same to you. 🙈 Can I <b>prove</b> they&apos;re different without telling
          you which is which? That&apos;s a <b>zero-knowledge proof</b>!
        </Narrator>
        <div className="cut bg-night-2/90 p-6 text-cream/80">
          <p className="font-display text-2xl text-cream">How to play</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">
            <li>Hide the snowballs behind your back and <b>secretly swap them or not</b>.</li>
            <li>The prover must tell you whether you swapped.</li>
            <li>But beware: the prover might be <b>Vex</b> in disguise, who is colour-blind too and can only guess!</li>
            <li>Test as many times as you like, then decide: honest Hima, or faker Vex?</li>
          </ol>
        </div>
        <div className="flex justify-center">
          <BigButton tone="brass" onClick={start}>Meet the mystery prover 🎭</BigButton>
        </div>
      </div>
    );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Narrator who={revealed ? prover : "relay"} mood={revealed && prover === "vex" ? "sly" : "happy"}>
        {caught ? (
          <>
            <b>Caught!</b> The prover got it wrong, so it can&apos;t really see colours. It was <b>Vex</b> all along! 😈
          </>
        ) : verdict ? (
          verdict === prover ? (
            <>
              Correct! It was <b>{prover === "hima" ? "honest Hima" : "faker Vex"}</b>. 🎉
            </>
          ) : (
            <>
              Oops! It was actually <b>{prover === "hima" ? "honest Hima" : "Vex, who got lucky"}</b>.{" "}
              {streak < 4 ? "Test more rounds before you decide!" : ""}
            </>
          )
        ) : phase === "hidden" ? (
          <>The snowballs are behind your back… the prover is thinking. 🤔</>
        ) : (
          <>
            Hide the snowballs and choose: <b>swap</b> or <b>don&apos;t swap</b>. Then watch whether the mystery prover gets it
            right.
          </>
        )}
      </Narrator>

      <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
        {/* Stage */}
        <div className="cut relative flex flex-col items-center gap-6 bg-night-2/90 p-6">
          <div className="relative h-32 w-72">
            {[0, 1].map((ball) => {
              const left = (ball === 0) !== swapped ? "8%" : "62%";
              const trueColour = ball === 0 ? "#f4b728" : "#7fe0cc";
              return (
                <span
                  key={ball}
                  className={`absolute top-4 size-24 rounded-full transition-all duration-700 ${phase === "hidden" ? "scale-75 opacity-20 blur-sm" : ""}`}
                  style={{
                    left,
                    background: revealed
                      ? `radial-gradient(circle at 35% 30%, white, ${trueColour} 45%, #000 120%)`
                      : "radial-gradient(circle at 35% 30%, #f5f5f5, #9a9a9a 50%, #2a2a2a 120%)",
                  }}
                />
              );
            })}
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cream/50">
            {revealed ? "true colours revealed" : "what you see (colour-blind)"}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <BigButton onClick={() => challenge(true)} disabled={phase === "hidden" || revealed}>Swap 🔀</BigButton>
            <BigButton tone="glacier" onClick={() => challenge(false)} disabled={phase === "hidden" || revealed}>Don&apos;t swap ✋</BigButton>
          </div>

          {phase === "answered" && (
            <div key={streak + (caught ? 100 : 0)} className="pop-in flex items-center gap-3">
              <span className="relative">
                <Portrait img={art(revealed ? prover : "relay", "sm")} face={revealed ? agentById(prover).face : "50% 50%"} size={52} ring="#8b7bff" className={revealed ? "" : "brightness-0"} />
                {!revealed && <span className="font-display absolute inset-0 grid place-items-center text-2xl text-violet">?</span>}
              </span>
              <span className={`cut-sm px-4 py-2 font-display text-lg ${lastAnswer === lastSwap ? "bg-glacier text-night" : "bg-ember text-night"}`}>
                “You {lastAnswer ? "swapped" : "didn't swap"}!” {lastAnswer === lastSwap ? "✓" : "✗"}
              </span>
            </div>
          )}
        </div>

        {/* Confidence */}
        <div className="cut flex flex-col gap-4 bg-night-2/90 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-cream/50">Rounds passed</p>
          <p className="font-display text-6xl text-gold">{streak}</p>
          <div>
            <p className="text-sm text-cream/70">If this is a faker, the chance they got this lucky:</p>
            <p className="font-display mt-1 text-3xl text-cream">1 in {luck.toLocaleString()}</p>
            <div className="mt-2 h-2 bg-white/10">
              <div className="h-full bg-glacier transition-all duration-700" style={{ width: `${Math.min(100, (1 - 1 / luck) * 100)}%` }} />
            </div>
            <p className="mt-1 font-mono text-[0.65rem] text-cream/40">your confidence: {((1 - 1 / luck) * 100).toFixed(streak > 9 ? 2 : 0)}%</p>
          </div>

          {!revealed ? (
            <div className="mt-auto space-y-2">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold">Your verdict</p>
              <button type="button" onClick={() => declare("hima")} className="cut-sm flex w-full items-center gap-3 border border-glacier/40 px-3 py-2 text-left text-cream hover:bg-glacier/10">
                <Portrait img={art("hima", "sm")} face={hima.face} size={32} /> Honest Hima ✅
              </button>
              <button type="button" onClick={() => declare("vex")} className="cut-sm flex w-full items-center gap-3 border border-ember/40 px-3 py-2 text-left text-cream hover:bg-ember/10">
                <Portrait img={art("vex", "sm")} face={vex.face} size={32} /> Faker Vex 😈
              </button>
            </div>
          ) : (
            <div className="mt-auto flex flex-col gap-2">
              <BigButton tone="brass" onClick={start}>Play again 🔁</BigButton>
            </div>
          )}
        </div>
      </div>

      {won && (
        <div className="flex flex-col items-center gap-3">
          <Narrator who="hima" mood="wow">
            Here&apos;s the magic: you became <b>sure</b> the snowballs are different, but you <b>still don&apos;t know which one
            is gold!</b> That&apos;s zero knowledge. Zcash does the same with payments: it proves the money is real and
            not spent twice, without showing who, to whom, or how much.
          </Narrator>
          <Tech>Zcash&apos;s zk-SNARKs are non-interactive (one proof, no back-and-forth), and Orchard&apos;s Halo 2 proofs need no trusted setup.</Tech>
          <BigButton onClick={onDone}>Collect your cards 🃏</BigButton>
        </div>
      )}
    </div>
  );
}
