"use client";

/**
 * Level 1 · The Magic Key  (real DKG)
 *   secret snowflake  = each player's secret polynomial      (DKG part 1)
 *   its shadow        = public commitments + proof            (round-1 broadcast)
 *   secret pieces     = private shares for each other player  (DKG part 2)
 *   mixing the pieces = deriving the key share + group key    (DKG part 3)
 *   team crystal      = picture of the group public key
 */

import { useState } from "react";
import { bytes, dkgCommit, dkgDeal, dkgFinish, everyoneAgrees, groupKey, type Ceremony } from "@/lib/game/engine";
import { sfx } from "./fx";
import { BigButton, Narrator, RoundTable, Scene, useGame, type Seat } from "./play-ui";
import { Sigil } from "./Sigil";
import { friendOf } from "./world";

type Step = "intro" | "snowflakes" | "swap" | "build" | "check" | "done";

export function LevelKey({
  ceremony: c,
  setCeremony,
  onDone,
}: {
  ceremony: Ceremony;
  setCeremony: (c: Ceremony) => void;
  onDone: (stars: number) => void;
}) {
  const { log } = useGame();
  const [step, setStep] = useState<Step>("intro");
  const [swapping, setSwapping] = useState(false);
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);

  const committed = (i: number) => !!c.round1[i];
  const allCommitted = c.players.every((p) => committed(p.index));
  const gk = groupKey(c);

  const commit = (indices: number[]) => {
    let next = c;
    for (const i of indices) {
      if (next.round1[i]) continue;
      next = dkgCommit(next, i);
      log({ actor: friendOf(i).name, kind: "broadcast", text: "DKG round 1 → everyone: commitments + proof of knowledge", bytes: bytes(next.round1[i].package) });
    }
    sfx("magic");
    setCeremony(next);
  };

  const swap = () => {
    let next = c;
    for (const p of c.players) {
      next = dkgDeal(next, p.index);
      for (const [to, pkg] of Object.entries(next.round2[p.index].packages)) {
        log({ actor: p.name, kind: "private", text: `DKG round 2 → ${friendOf(Number(to)).name} only (secret share)`, bytes: bytes(pkg) });
      }
    }
    setCeremony(next);
    setSwapping(true);
    sfx("whoosh");
    window.setTimeout(() => {
      setSwapping(false);
      setStep("build");
      sfx("tap");
    }, 1800);
  };

  const build = () => {
    let next = c;
    for (const p of c.players) {
      next = dkgFinish(next, p.index);
      log({ actor: p.name, kind: "local", text: `verified ${c.n - 1} shares, derived own key share` });
    }
    setCeremony(next);
    log(
      everyoneAgrees(next)
        ? { actor: "Team", kind: "success", text: `all ${c.n} derived the same group key ${groupKey(next)!.slice(0, 12)}…` }
        : { actor: "Team", kind: "failure", text: "group keys differ" },
    );
    sfx("success");
    setStep("check");
  };

  const seats: Seat[] = c.players.map((p) => {
    const friend = friendOf(p.index, p.name);
    const base: Seat = { index: p.index, friend };
    if (step === "snowflakes") {
      return committed(p.index)
        ? { ...base, state: "done", badge: "❄️" }
        : { ...base, state: "active", hint: true, onClick: () => commit([p.index]) };
    }
    if (step === "swap") return { ...base, state: "done", badge: swapping ? "✉️" : "❄️" };
    if (step === "build") return { ...base, state: "done", badge: "✉️" };
    if (step === "check" || step === "done") {
      return { ...base, state: "done", badge: "🔑", below: gk ? <Sigil hex={c.result[p.index].group_key} size={42} /> : null };
    }
    return { ...base, state: "idle" };
  });

  // Everyone sends a piece to everyone else while swapping.
  const links: [number, number][] = swapping
    ? c.players.flatMap((_, a) => c.players.map((__, b) => [a, b] as [number, number]).filter(([x, y]) => x !== y))
    : [];

  const center =
    step === "intro" ? (
      <span className="text-6xl">🎁</span>
    ) : step === "check" || step === "done" ? (
      gk && (
        <div className="pop-in flex flex-col items-center">
          <Sigil hex={gk} size={110} />
          <span className="mt-1 rounded-full bg-brass/15 px-3 py-0.5 text-xs font-bold text-brass">team crystal</span>
        </div>
      )
    ) : (
      <span className="text-5xl opacity-80">{step === "swap" ? "✉️" : step === "build" ? "🌀" : "❄️"}</span>
    );

  if (step === "intro")
    return (
      <Scene
        narrator={
          <Narrator tech="Level 1 is distributed key generation (DKG): no dealer, and the group private key is never assembled.">
            Your team has a treasure chest 🎁. To lock it, you need a <b>magic key</b>. But here&apos;s the rule:{" "}
            <b>nobody</b> may hold the whole key. Not even one friend! Let&apos;s make it together.
          </Narrator>
        }
        stage={<RoundTable seats={seats} center={center} />}
        action={<BigButton onClick={() => { sfx("tap"); setStep("snowflakes"); }}>Let&apos;s make the key! ✨</BigButton>}
      />
    );

  if (step === "snowflakes")
    return (
      <Scene
        narrator={
          <Narrator tech="DKG part 1: each device samples a secret polynomial and broadcasts commitments to its coefficients plus a proof of knowledge.">
            {allCommitted ? (
              <>Great! Everyone has a secret snowflake ❄️ hidden in their pocket. 🤫</>
            ) : (
              <>
                <b>Step 1:</b> Tap each friend! They make a <b>secret snowflake</b> ❄️ and hide it. They only show its{" "}
                <b>shadow</b> to everyone, so nobody can cheat later.
              </>
            )}
          </Narrator>
        }
        stage={<RoundTable seats={seats} center={center} />}
        action={
          allCommitted ? (
            <BigButton onClick={() => { sfx("tap"); setStep("swap"); }}>Next step →</BigButton>
          ) : (
            <BigButton onClick={() => commit(c.players.map((p) => p.index))}>Everyone at once! ❄️</BigButton>
          )
        }
      />
    );

  if (step === "swap")
    return (
      <Scene
        narrator={
          <Narrator tech={`DKG part 2: each device sends one private share to each of the other ${c.n - 1} players (${c.n * (c.n - 1)} secret messages in total). In room mode these are encrypted to the recipient.`}>
            <b>Step 2:</b> Each friend breaks off a tiny piece of their snowflake for <b>every other friend</b>, and passes
            it in a secret envelope ✉️. Only the friend it&apos;s for can open it.
          </Narrator>
        }
        stage={<RoundTable seats={seats} center={center} links={links} />}
        action={<BigButton onClick={swap} disabled={swapping}>{swapping ? "Passing envelopes…" : "Pass the secret pieces! ✉️"}</BigButton>}
      />
    );

  if (step === "build")
    return (
      <Scene
        narrator={
          <Narrator tech="DKG part 3: each device verifies every received share against the round-1 commitments, sums them into its key share, and computes the group public key.">
            <b>Step 3:</b> Every friend opened their envelopes. Now they <b>mix the pieces</b> together to make their own
            piece of the key 🔑. Ready?
          </Narrator>
        }
        stage={<RoundTable seats={seats} center={center} />}
        action={<BigButton tone="brass" onClick={build}>Mix the pieces! 🌀</BigButton>}
      />
    );

  // check / done
  return (
    <Scene
      narrator={
        <Narrator
          mood="wow"
          tech={`Group verifying key ${gk?.slice(0, 16)}… The picture is drawn from its bytes: same key, same crystal. Any ${c.t} key shares can sign for it.`}
        >
          {answer === null && (
            <>
              Wow! Under each friend is a little crystal 💎. That crystal is a picture of the <b>team key</b>. Look closely:{" "}
              <b>do all the crystals match?</b>
            </>
          )}
          {answer === "yes" && (
            <>
              Yes! 🎉 Everyone has the <b>same team crystal</b>, but each friend only holds <b>one piece</b> of the secret.
              Any {c.t} friends together can open the chest. {c.t - 1} alone can&apos;t!
            </>
          )}
          {answer === "no" && (
            <>
              Look again! 👀 They are <b>exactly the same</b>. Every friend made the same team crystal, and nobody ever
              held the whole key.
            </>
          )}
        </Narrator>
      }
      stage={<RoundTable seats={seats} center={center} />}
      action={
        answer === null ? (
          <>
            <BigButton onClick={() => { setAnswer("yes"); sfx("star"); }}>Yes, they match! ✅</BigButton>
            <BigButton tone="ember" onClick={() => { setAnswer("no"); sfx("tap"); }}>No, they&apos;re different</BigButton>
          </>
        ) : (
          <BigButton tone="brass" onClick={() => { setStep("done"); onDone(answer === "yes" ? 3 : 2); }}>
            Finish level 🏆
          </BigButton>
        )
      }
    />
  );
}
