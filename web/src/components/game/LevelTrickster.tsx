"use client";

/**
 * Level 2 · Catch the Trickster  (real threshold signing + cheater detection)
 *   the letter       = the message being signed (demo text, not a transaction)
 *   getting ready    = round-1 nonce commitments
 *   puzzle piece     = signature share (round 2)
 *   the trickster    = a signer who signs a different message (simulated role, real crypto)
 *   magic checker    = aggregate(): verifies every share and names the culprit
 */

import { useEffect, useRef, useState } from "react";
import { textToHex } from "@/lib/frost";
import {
  aggregate,
  bytes,
  newAttempt,
  openRound,
  signAll,
  signCommit,
  signShare,
  type Attempt,
  type Ceremony,
} from "@/lib/game/engine";
import { sfx } from "./fx";
import { BigButton, Narrator, RoundTable, Scene, useGame, type Seat } from "./play-ui";
import { friendOf, LETTER } from "./world";

type Step = "intro" | "pick" | "sign" | "guess" | "check" | "chest";

function randomPick<T>(items: T[]): T {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return items[buf[0] % items.length];
}

export function LevelTrickster({ ceremony: c, onDone }: { ceremony: Ceremony; onDone: (stars: number) => void }) {
  const { log } = useGame();
  const [step, setStep] = useState<Step>("intro");
  const [picked, setPicked] = useState<number[]>(() => c.players.slice(0, c.t).map((p) => p.index));
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [suspect, setSuspect] = useState<number | null>(null);
  const [checked, setChecked] = useState(0);
  const [retry, setRetry] = useState<Attempt | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  const name = (i: number) => friendOf(i, c.players.find((p) => p.index === i)?.name).name;
  const culprits = attempt?.outcome?.culprits ?? [];
  const trickster = attempt?.cheater ?? null;

  const ready = () => {
    const cheater = randomPick(picked);
    let a = newAttempt(picked, textToHex(LETTER), cheater);
    for (const s of a.signers) {
      a = signCommit(c, a, s);
      log({ actor: name(s), kind: "broadcast", text: "signing round 1 → coordinator: nonce commitments", bytes: bytes(a.commits[s].commitments) });
    }
    a = openRound(c, a);
    log({ actor: "Coordinator", kind: "coordinator", text: "signing package + randomizer seed → signers", bytes: bytes(a.round!.signing_package) });
    log({ actor: "Game", kind: "local", text: `secret role dealt: ${name(cheater)} will sign a different message (simulated)` });
    setAttempt(a);
    sfx("magic");
    setStep("sign");
  };

  const sign = () => {
    let a = attempt!;
    for (const s of a.signers) {
      a = signShare(c, a, s);
      log({ actor: name(s), kind: "broadcast", text: "signature share → coordinator", bytes: bytes(a.shares[s]) });
    }
    setAttempt(a);
    sfx("whoosh");
    setStep("guess");
  };

  const check = () => {
    const a = aggregate(c, attempt!);
    setAttempt(a);
    const o = a.outcome!;
    log(
      o.ok
        ? { actor: "Coordinator", kind: "success", text: "aggregated a valid signature" }
        : { actor: "Coordinator", kind: "failure", text: `refused: invalid share from ${o.culprits.map(name).join(", ")}` },
    );
    setStep("check");
    setChecked(0);
    let k = 0;
    timer.current = window.setInterval(() => {
      k += 1;
      setChecked(k);
      const signer = a.signers[k - 1];
      sfx(o.culprits.includes(signer) ? "fail" : "tap");
      if (k >= a.signers.length && timer.current) window.clearInterval(timer.current);
    }, 750);
  };

  const honestSet = (() => {
    if (!attempt || culprits.length === 0) return null;
    const keep = attempt.signers.filter((s) => !culprits.includes(s));
    const spare = c.players.map((p) => p.index).filter((i) => !attempt.signers.includes(i));
    while (keep.length < c.t && spare.length) keep.push(spare.shift()!);
    return keep.length >= c.t ? keep : null;
  })();

  const openChest = () => {
    if (!honestSet) return;
    const r = signAll(c, honestSet, attempt!.messageHex);
    setRetry(r);
    log({
      actor: "Coordinator",
      kind: r.outcome?.ok ? "success" : "failure",
      text: r.outcome?.ok ? `retry with ${honestSet.map(name).join(", ")}: valid signature` : "retry failed",
    });
    sfx(r.outcome?.ok ? "success" : "fail");
    setStep("chest");
  };

  const guessedRight = suspect !== null && suspect === trickster;
  const doneChecking = !!attempt && checked >= attempt.signers.length;

  /* ---------------- seats ---------------- */
  const seats: Seat[] = c.players.map((p) => {
    const friend = friendOf(p.index, p.name);
    const base: Seat = { index: p.index, friend };
    const signing = attempt?.signers.includes(p.index) ?? picked.includes(p.index);
    if (step === "pick") {
      const on = picked.includes(p.index);
      return {
        ...base,
        state: on ? "picked" : "idle",
        badge: on ? "✋" : undefined,
        onClick: () => {
          sfx("tap");
          setPicked((s) => (s.includes(p.index) ? s.filter((x) => x !== p.index) : [...s, p.index]));
        },
      };
    }
    if (step === "intro") return { ...base, state: "idle" };
    if (!signing) return { ...base, state: "dim" };
    if (step === "sign") return { ...base, state: "picked", badge: "📜" };
    if (step === "guess")
      return {
        ...base,
        state: suspect === p.index ? "bad" : "picked",
        badge: suspect === p.index ? "🤔" : "🧩",
        hint: suspect === null,
        onClick: () => {
          sfx("tap");
          setSuspect(p.index);
        },
      };
    if (step === "check") {
      const pos = attempt!.signers.indexOf(p.index);
      const seen = pos < checked;
      const bad = culprits.includes(p.index);
      return { ...base, state: seen ? (bad ? "bad" : "done") : "picked", badge: seen ? (bad ? "❌" : "✅") : "🧩" };
    }
    // chest
    const isT = p.index === trickster;
    const helped = retry && honestSet?.includes(p.index);
    return { ...base, state: isT ? "bad" : helped ? "done" : "dim", badge: isT ? "😈" : helped ? "✅" : undefined };
  });

  const centerLetter = (
    <div className="pop-in flex flex-col items-center">
      <span className="text-5xl">📜</span>
      <span className="mt-1 max-w-[9rem] text-center text-[0.7rem] font-semibold text-bone/80">“{LETTER}”</span>
    </div>
  );

  if (step === "intro")
    return (
      <Scene
        narrator={
          <Narrator tech={`Threshold signing: any ${c.t} of ${c.n} key shares produce one signature. FROST v3 verifies each share and identifies cheaters.`}>
            Time to open the treasure chest! 🎁 It opens when <b>{c.t} agents</b> sign the same letter. But watch out…{" "}
            <b>Vex the Trickster</b> 😈 is going to sneak inside one of them and sign a <i>different</i> letter. Can you
            catch Vex?
          </Narrator>
        }
        stage={<RoundTable seats={seats} center={<span className="text-6xl">🎁</span>} />}
        action={<BigButton onClick={() => { sfx("tap"); setStep("pick"); }}>Choose the signers ✋</BigButton>}
      />
    );

  if (step === "pick")
    return (
      <Scene
        narrator={
          <Narrator>
            Tap friends to pick <b>at least {c.t}</b> who will sign the letter. 📜
            {c.n > c.t && <> Tip: leave someone out, so you have a spare friend if somebody cheats!</>}
          </Narrator>
        }
        stage={<RoundTable seats={seats} center={centerLetter} />}
        action={
          <BigButton onClick={ready} disabled={picked.length < c.t}>
            {picked.length < c.t ? `Pick ${c.t - picked.length} more` : `Ready with ${picked.length} friends! 🤫`}
          </BigButton>
        }
      />
    );

  if (step === "sign")
    return (
      <Scene
        narrator={
          <Narrator mood="sly" tech="Each signer has committed to fresh single-use nonces. The coordinator has drawn a randomizer for this signature.">
            Heh heh… I&apos;m <b>Vex</b>. I just slipped inside <b>one of your agents</b>. 😈 When everyone signs, my
            puppet will sign a different letter, and hand Relay a fake <b>puzzle piece</b> 🧩. Good luck!
          </Narrator>
        }
        stage={<RoundTable seats={seats} center={centerLetter} />}
        action={<BigButton onClick={sign}>Everyone sign the letter! ✍️</BigButton>}
      />
    );

  if (step === "guess")
    return (
      <Scene
        narrator={
          <Narrator tech="Every signature share is just a large number. A share over the wrong message looks no different from an honest one.">
            All the puzzle pieces 🧩 look <b>exactly the same</b>, right? So… <b>which agent is Vex hiding in?</b> Tap
            your suspect!
          </Narrator>
        }
        stage={<RoundTable seats={seats} center={centerLetter} />}
        action={
          <BigButton tone="brass" onClick={check} disabled={suspect === null}>
            {suspect === null ? "Tap your suspect first" : `I think it's ${name(suspect)}! Check! 🔍`}
          </BigButton>
        }
      />
    );

  if (step === "check")
    return (
      <Scene
        narrator={
          <Narrator
            mood={doneChecking ? "wow" : "happy"}
            tech="aggregate(): each share is checked against that signer's public verifying share from the key ceremony; FROST v3 returns the culprits."
          >
            {!doneChecking && <>My checker 🔍 tests every puzzle piece, one by one…</>}
            {doneChecking && (
              <>
                <b>Caught!</b> Vex was hiding inside <b>{culprits.map(name).join(", ")}</b>! 😈{" "}
                {guessedRight ? (
                  <>And <b>you guessed it!</b> Bonus star ⭐</>
                ) : (
                  <>You guessed {suspect !== null ? name(suspect) : "nobody"}. Tricky! The checker never guesses, it uses math. 🧮</>
                )}
              </>
            )}
          </Narrator>
        }
        stage={
          <div className="relative">
            <RoundTable seats={seats} center={centerLetter} />
            {doneChecking && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="stamp flex items-center gap-3 whitespace-nowrap border-4 border-ember bg-night/90 py-1 pl-1 pr-4 font-display text-3xl tracking-widest text-ember">
                  <span
                    className="block size-12 bg-no-repeat"
                    style={{ backgroundImage: "url(/art/vex-sm.webp)", backgroundSize: "300%", backgroundPosition: "53% 6%" }}
                  />
                  Busted!
                </span>
              </div>
            )}
          </div>
        }
        action={
          doneChecking &&
          (honestSet ? (
            <BigButton tone="brass" onClick={openChest}>
              Open the chest without {culprits.map(name).join(", ")} 🎁
            </BigButton>
          ) : (
            <BigButton onClick={() => onDone(guessedRight ? 3 : 2)}>Finish level 🏆</BigButton>
          ))
        }
      />
    );

  // chest
  const ok = !!retry?.outcome?.ok;
  return (
    <Scene
      narrator={
        <Narrator mood="wow" tech={ok ? `Valid signature by ${honestSet?.map(name).join(", ")} over “${LETTER}”.` : undefined}>
          {ok ? (
            <>
              The honest friends signed again and… <b>the chest is open!</b> 🎉 Cheaters can&apos;t fake it, and they always
              get caught.
            </>
          ) : honestSet === null ? (
            <>
              Uh-oh! Without the trickster there aren&apos;t enough friends left to open the chest. That&apos;s why real teams
              keep <b>spare friends</b>!
            </>
          ) : (
            <>Hmm, that didn&apos;t work. Try again!</>
          )}
        </Narrator>
      }
      stage={
        <RoundTable
          seats={seats}
          center={<span className={`text-7xl ${ok ? "chest-open" : ""}`}>{ok ? "💰" : "🎁"}</span>}
        />
      }
      action={<BigButton tone="brass" onClick={() => onDone(guessedRight ? 3 : 2)}>Finish level 🏆</BigButton>}
    />
  );
}
