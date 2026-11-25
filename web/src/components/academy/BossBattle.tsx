"use client";

import Image from "next/image";
import { useState } from "react";
import { art } from "@/lib/agents";
import { completeLesson, QUIZ } from "@/lib/academy";
import { Confetti, sfx } from "../game/fx";
import { BigButton, Narrator } from "../game/play-ui";

const HEARTS = 3;

export function BossBattle({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [vexHp, setVexHp] = useState(QUIZ.length);
  const [hearts, setHearts] = useState(HEARTS);
  const [picked, setPicked] = useState<number | null>(null);
  const [hitKey, setHitKey] = useState(0);

  const q = QUIZ[i];
  const won = vexHp === 0;
  const lost = hearts === 0;
  const answered = picked !== null;
  const right = answered && picked === q.answer;

  const pick = (k: number) => {
    if (answered || won || lost) return;
    setPicked(k);
    if (k === q.answer) {
      setVexHp((h) => h - 1);
      setHitKey((n) => n + 1);
      sfx("star");
      if (vexHp - 1 === 0) {
        completeLesson("boss");
        window.setTimeout(() => sfx("success"), 300);
      }
    } else {
      setHearts((h) => h - 1);
      sfx("fail");
    }
  };

  const next = () => {
    setPicked(null);
    setI((n) => (n + 1) % QUIZ.length);
  };

  const restart = () => {
    setI(0);
    setVexHp(QUIZ.length);
    setHearts(HEARTS);
    setPicked(null);
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {won && <Confetti />}
      {/* Arena */}
      <div className="cut relative h-72 overflow-hidden bg-night-2">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,rgb(255_122_69/0.35),transparent_65%)]" />
        <div key={hitKey} className={`absolute bottom-0 right-[6%] h-[120%] w-[40%] mix-blend-lighten ${hitKey ? "hit" : ""} ${won ? "opacity-20 grayscale" : ""}`}>
          <Image src={art("vex", "sm")} alt="Vex" fill sizes="40vw" className="object-cover object-top" />
        </div>
        <div className="absolute left-5 top-5 right-[48%] space-y-4">
          <div>
            <p className="flex justify-between font-display text-xl text-cream">
              Vex <span className="text-ember">{vexHp} / {QUIZ.length}</span>
            </p>
            <div className="mt-1 h-3 bg-white/10">
              <div className="h-full bg-ember transition-all duration-500" style={{ width: `${(vexHp / QUIZ.length) * 100}%` }} />
            </div>
          </div>
          <div>
            <p className="font-display text-xl text-cream">You</p>
            <p className="mt-1 text-2xl" aria-label={`${hearts} hearts left`}>
              {Array.from({ length: HEARTS }, (_, k) => (k < hearts ? "💛" : "🖤")).join(" ")}
            </p>
          </div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-gold">Boss battle · answer to attack</p>
        </div>
        {won && <p className="stamp absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-gold bg-night/90 px-6 py-2 font-display text-5xl text-gold">Victory!</p>}
      </div>

      {won ? (
        <div className="flex flex-col items-center gap-4">
          <Narrator who="relay" mood="wow">
            You defeated Vex with <b>pure Zcash knowledge</b>! 🏆 You&apos;re officially a <b>Zcash Cadet</b>. Go teach a friend.
          </Narrator>
          <BigButton tone="brass" onClick={onDone}>Claim your badge 🏅</BigButton>
        </div>
      ) : lost ? (
        <div className="flex flex-col items-center gap-4">
          <Narrator mood="sly">Heh heh… out of hearts! Go replay a lesson and come back stronger. 😈</Narrator>
          <BigButton onClick={restart}>Try again</BigButton>
        </div>
      ) : (
        <>
          <Narrator mood="sly">{q.q}</Narrator>
          <div className="grid gap-3 sm:grid-cols-2">
            {q.options.map((o, k) => {
              const isAnswer = k === q.answer;
              const state = !answered ? "idle" : isAnswer ? "right" : k === picked ? "wrong" : "idle";
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => pick(k)}
                  disabled={answered}
                  className={`cut-sm border-2 px-5 py-4 text-left text-lg transition-all ${state === "right" ? "border-glacier bg-glacier/15 text-cream" : state === "wrong" ? "border-ember bg-ember/15 text-cream" : "border-white/10 text-cream/85 hover:border-gold hover:bg-gold/5"} disabled:cursor-default`}
                >
                  <span className="font-display mr-3 text-gold">{String.fromCharCode(65 + k)}</span>
                  {o}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className="pop-in flex flex-col items-center gap-3 text-center">
              <p className={`font-display text-2xl ${right ? "text-glacier" : "text-ember"}`}>{right ? "Direct hit! ⚡" : "Ouch! Vex dodged."}</p>
              <p className="max-w-xl text-cream/75">{q.why}</p>
              <BigButton onClick={next}>Next question →</BigButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
