"use client";

import { useMemo, useState } from "react";
import { textToHex } from "@/lib/frost";
import {
  aggregate,
  bytes,
  nameOf,
  newAttempt,
  openRound,
  signAll,
  signCommit,
  signShare,
  type Attempt,
  type Ceremony,
} from "@/lib/game/engine";
import { AlertIcon, ArrowIcon, CheckIcon } from "../icons";
import {
  ActionBar,
  Avatar,
  Explain,
  GhostButton,
  HexChip,
  LevelHeader,
  PrimaryButton,
  SimulatedTag,
  Stepper,
  type PushLog,
} from "./kit";

const STEPS = [
  { key: "choose", label: "Pick signers" },
  { key: "commit", label: "Round 1 · Commit" },
  { key: "open", label: "Coordinator" },
  { key: "sign", label: "Round 2 · Sign" },
  { key: "agg", label: "Aggregate" },
];

const DEFAULT_MESSAGE = "PU DAO: approve the club's chai budget";

function randomPick<T>(items: T[]): T {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return items[buf[0] % items.length];
}

export function LevelCheater({
  ceremony: c,
  log,
  onNext,
}: {
  ceremony: Ceremony;
  log: PushLog;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<number[]>(() => c.players.slice(0, c.t).map((p) => p.index));
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [peek, setPeek] = useState(false);
  const [suspect, setSuspect] = useState<number | null>(null);
  const [retry, setRetry] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const a = attempt;
  const allCommitted = !!a && a.signers.every((s) => a.commits[s]);
  const allSigned = !!a && a.signers.every((s) => a.shares[s]);
  const step = !a ? 0 : !allCommitted ? 1 : !a.round ? 2 : !allSigned ? 3 : 4;
  const outcome = a?.outcome ?? null;
  const culprits = useMemo(() => outcome?.culprits ?? [], [outcome]);

  const guard = (fn: () => void) => {
    setError(null);
    try {
      fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      log({ actor: "Engine", kind: "failure", text: msg });
    }
  };

  const toggle = (i: number) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  const start = () =>
    guard(() => {
      const cheater = randomPick(selected);
      setAttempt(newAttempt(selected, textToHex(message), cheater));
      setSuspect(null);
      setRetry(null);
      setPeek(false);
      log({ actor: "Game", kind: "local", text: `roles dealt in secret. One of ${selected.length} signers will cheat (simulated).` });
    });

  const commit = (who: number[]) =>
    guard(() => {
      let next = a!;
      for (const i of who) {
        next = signCommit(c, next, i);
        log({ actor: nameOf(c, i), kind: "broadcast", text: "signing round 1 → coordinator: nonce commitments", bytes: bytes(next.commits[i].commitments) });
      }
      setAttempt(next);
    });

  const open = () =>
    guard(() => {
      const next = openRound(c, a!);
      log({
        actor: "Coordinator",
        kind: "coordinator",
        text: `signing package (message + ${next.signers.length} commitments) + randomizer seed → signers`,
        bytes: bytes(next.round!.signing_package),
      });
      setAttempt(next);
    });

  const sign = (who: number[]) =>
    guard(() => {
      let next = a!;
      for (const i of who) {
        next = signShare(c, next, i);
        // Deliberately identical log line for the cheater: a bad share looks like any other.
        log({ actor: nameOf(c, i), kind: "broadcast", text: "signature share → coordinator", bytes: bytes(next.shares[i]) });
      }
      setAttempt(next);
    });

  const runAggregate = () =>
    guard(() => {
      const next = aggregate(c, a!);
      setAttempt(next);
      const o = next.outcome!;
      if (o.ok) {
        log({ actor: "Coordinator", kind: "success", text: "aggregated a valid signature" });
      } else {
        log({
          actor: "Coordinator",
          kind: "failure",
          text: `aggregation refused: invalid signature share from ${o.culprits.map((i) => nameOf(c, i)).join(", ")}`,
        });
      }
    });

  // An honest signer set without the culprits, topped up with players who sat out.
  const honestSet = useMemo(() => {
    if (!a || culprits.length === 0) return null;
    const keep = a.signers.filter((s) => !culprits.includes(s));
    const spare = c.players.map((p) => p.index).filter((i) => !a.signers.includes(i));
    while (keep.length < c.t && spare.length) keep.push(spare.shift()!);
    return keep.length >= c.t ? keep : null;
  }, [a, culprits, c]);

  const runRetry = () =>
    guard(() => {
      if (!honestSet) return;
      const next = signAll(c, honestSet, a!.messageHex, null);
      setRetry(next);
      log({
        actor: "Coordinator",
        kind: next.outcome!.ok ? "success" : "failure",
        text: next.outcome!.ok
          ? `retry with ${honestSet.map((i) => nameOf(c, i)).join(", ")}: valid signature`
          : "retry failed",
      });
    });

  const verb = step === 1 ? "Commit" : step === 3 ? "Sign" : "";
  const pending = a ? a.signers.filter((s) => (step === 1 ? !a.commits[s] : step === 3 ? !a.shares[s] : false)) : [];

  return (
    <div className="space-y-8">
      <LevelHeader
        level={2}
        title={
          <>
            Catch the Cheater. <em className="text-ember">Misbehaviour has a name.</em>
          </>
        }
        lesson="One signer will be secretly told to sign a different message. Their signature share looks exactly like everyone else's. Can you spot them before FROST does?"
      >
        <Stepper steps={STEPS} current={step} done={!!outcome} />
      </LevelHeader>

      {/* Step 0: choose signers + message */}
      {!a && (
        <section className="panel space-y-6 p-6">
          <div>
            <p className="eyebrow">Who signs this round?</p>
            <p className="mt-1 text-sm text-moss">
              Pick at least {c.t}. Leave someone out if you can, so there&apos;s a spare signer for the retry.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.players.map((p) => {
                const on = selected.includes(p.index);
                return (
                  <button
                    key={p.index}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(p.index)}
                    className={`flex items-center gap-2 rounded-2xl border py-1.5 pl-1.5 pr-4 text-sm transition-colors ${on ? "border-glacier/50 bg-glacier/10 text-bone" : "border-bone/10 text-moss hover:text-bone"}`}
                  >
                    <Avatar name={p.name} state={on ? "done" : "idle"} size="sm" />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block">
            <span className="eyebrow">Message to sign</span>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={120}
              className="mt-2 w-full rounded-xl border border-glacier/15 bg-ink px-4 py-3 text-bone outline-none focus:border-glacier/50"
            />
            <span className="mt-1 block font-mono text-[0.65rem] text-moss-deep">demo message, not a transaction</span>
          </label>
          <ActionBar>
            <PrimaryButton onClick={start} disabled={selected.length < c.t || !message.trim()}>
              Deal secret roles <ArrowIcon />
            </PrimaryButton>
            {selected.length < c.t && <span className="text-sm text-ember">Need {c.t - selected.length} more.</span>}
          </ActionBar>
        </section>
      )}

      {a && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="space-y-4">
            {/* Signers */}
            <div className="grid gap-3 sm:grid-cols-2">
              {a.signers.map((i) => {
                const caught = culprits.includes(i);
                const isCheater = i === a.cheater;
                const share = a.shares[i];
                const did = step === 1 ? !!a.commits[i] : step === 3 ? !!share : step > 1;
                return (
                  <div
                    key={i}
                    className={`panel flex flex-col gap-3 p-4 ${caught ? "shake !border-ember/60" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={nameOf(c, i)} state={caught ? "bad" : outcome ? "done" : did ? "done" : "active"} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-semibold">
                          {nameOf(c, i)}
                          {(peek || outcome) && isCheater && <SimulatedTag>cheater</SimulatedTag>}
                        </p>
                        <p className="text-xs text-moss">
                          {caught ? "named by cheater detection" : share ? "share sent" : a.commits[i] ? "committed" : "waiting"}
                        </p>
                      </div>
                      {(step === 1 || step === 3) && !did && (
                        <button
                          type="button"
                          onClick={() => (step === 1 ? commit([i]) : sign([i]))}
                          className="rounded-full border border-glacier/40 px-3.5 py-1.5 text-xs font-semibold text-glacier transition-colors hover:bg-glacier hover:text-ink"
                        >
                          {verb}
                        </button>
                      )}
                    </div>
                    {share && <HexChip hex={share} tone={caught ? "ember" : "moss"} label="share" />}
                  </div>
                );
              })}
            </div>

            {(step === 1 || step === 3) && (
              <ActionBar>
                <PrimaryButton onClick={() => (step === 1 ? commit(pending) : sign(pending))}>
                  {verb} for everyone left ({pending.length}) <ArrowIcon />
                </PrimaryButton>
              </ActionBar>
            )}
            {step === 2 && (
              <ActionBar>
                <PrimaryButton onClick={open}>
                  Coordinator: open the round <ArrowIcon />
                </PrimaryButton>
              </ActionBar>
            )}

            {a.round && (
              <div className="panel space-y-2 p-4 text-sm">
                <p className="eyebrow">Signing round</p>
                <p className="flex flex-wrap items-center gap-2 text-moss">
                  Message: <span className="text-bone">“{message}”</span>
                </p>
                <p className="flex flex-wrap items-center gap-2 text-moss">
                  Randomized key for this signature: <HexChip hex={a.round.randomized_key} />
                </p>
              </div>
            )}

            {/* Step 4: suspect + aggregate */}
            {step === 4 && !outcome && (
              <div className="panel space-y-4 p-5">
                <p className="eyebrow !text-ember">Your call</p>
                <p className="text-sm text-moss">All shares are in, and they all look like random bytes. Who do you suspect?</p>
                <div className="flex flex-wrap gap-2">
                  {a.signers.map((i) => (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={suspect === i}
                      onClick={() => setSuspect(i)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${suspect === i ? "border-ember/60 bg-ember/15 text-ember" : "border-bone/10 text-moss hover:text-bone"}`}
                    >
                      {nameOf(c, i)}
                    </button>
                  ))}
                </div>
                <ActionBar>
                  <PrimaryButton onClick={runAggregate}>
                    Aggregate &amp; check every share <ArrowIcon />
                  </PrimaryButton>
                  <GhostButton onClick={() => setPeek((p) => !p)}>{peek ? "Hide roles" : "Presenter: peek"}</GhostButton>
                </ActionBar>
              </div>
            )}

            {outcome && !outcome.ok && (
              <div className="panel space-y-3 !border-ember/40 p-5">
                <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ember">
                  <AlertIcon /> aggregation refused · culprit identified
                </p>
                <p className="text-lg">
                  Invalid signature share from{" "}
                  <span className="text-ember">{culprits.map((i) => nameOf(c, i)).join(", ")}</span>.
                </p>
                {suspect !== null && (
                  <p className="text-sm text-moss">
                    You suspected {nameOf(c, suspect)}.{" "}
                    {culprits.includes(suspect) ? "Sharp eyes." : "FROST didn't need to guess."}
                  </p>
                )}
                <p className="font-mono text-[0.65rem] text-moss-deep">{outcome.error}</p>

                {!retry && honestSet && (
                  <ActionBar>
                    <PrimaryButton onClick={runRetry}>
                      Retry with {honestSet.map((i) => nameOf(c, i)).join(", ")} <ArrowIcon />
                    </PrimaryButton>
                  </ActionBar>
                )}
                {!honestSet && (
                  <p className="text-sm text-bone">
                    Without {culprits.map((i) => nameOf(c, i)).join(", ")} there are fewer than {c.t} honest signers left.
                    One cheater can block a group where n = t. That&apos;s why real setups keep spare signers (n &gt; t).
                  </p>
                )}
              </div>
            )}

            {retry?.outcome?.ok && (
              <div className="panel space-y-3 !border-brass/40 p-5">
                <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brass">
                  <CheckIcon /> valid signature
                </p>
                <p className="flex flex-wrap items-center gap-2 text-sm text-moss">
                  Signature <HexChip hex={retry.outcome.signature!} tone="brass" /> under randomized key{" "}
                  <HexChip hex={retry.outcome.randomized_key!} />
                </p>
                <ActionBar>
                  <PrimaryButton onClick={onNext}>
                    Level 4: Unlinkable <ArrowIcon />
                  </PrimaryButton>
                  <GhostButton onClick={() => { setAttempt(null); setRetry(null); }}>Play again</GhostButton>
                </ActionBar>
              </div>
            )}
            {error && <p className="font-mono text-sm text-ember">{error}</p>}
          </section>

          <div className="space-y-4">
            {step === 1 && (
              <Explain title="Round 1 · commit">
                <p>Each signer draws two fresh random <b>nonces</b> and sends only commitments to them. Nonces are single-use: reusing one would leak the key share, so the game deletes them right after signing.</p>
              </Explain>
            )}
            {step === 2 && (
              <Explain title="The coordinator">
                <p>The coordinator bundles the message with everyone&apos;s commitments and draws a <b>randomizer</b>. It learns nothing secret. At worst it can refuse to finish.</p>
              </Explain>
            )}
            {step === 3 && (
              <Explain title="Round 2 · sign">
                <p>Each signer combines their key share, nonces and the message into a <b>signature share</b>. One of them is secretly signing a different message.</p>
              </Explain>
            )}
            {step === 4 && !outcome && (
              <Explain title="Before aggregating">
                <p>Every share is just a big number. Nothing about the cheater&apos;s share looks different. The coordinator&apos;s only tool is the math.</p>
              </Explain>
            )}
            {outcome && (
              <Explain title="How FROST caught them">
                <p>Before combining, the coordinator checks every share against that player&apos;s public verifying share from the key ceremony. A share for the wrong message fails the check, and FROST v3 reports <b>exactly who</b> sent it.</p>
                <p>The cheater was <b>simulated</b>: they really signed a different message with their real key share.</p>
              </Explain>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
