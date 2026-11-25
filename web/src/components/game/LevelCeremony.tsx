"use client";

import { useState } from "react";
import {
  bytes,
  dkgCommit,
  dkgDeal,
  dkgFinish,
  everyoneAgrees,
  groupKey,
  nameOf,
  type Ceremony,
} from "@/lib/game/engine";
import { ArrowIcon, CheckIcon } from "../icons";
import {
  ActionBar,
  Avatar,
  Explain,
  HexChip,
  LevelHeader,
  PrimaryButton,
  Stepper,
  type PushLog,
} from "./kit";

const STEPS = [
  { key: "r1", label: "Round 1 · Commit" },
  { key: "r2", label: "Round 2 · Deal shares" },
  { key: "fin", label: "Finish · Derive keys" },
];

export function LevelCeremony({
  ceremony: c,
  setCeremony,
  log,
  onNext,
}: {
  ceremony: Ceremony;
  setCeremony: (c: Ceremony) => void;
  log: PushLog;
  onNext: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const has = (m: Record<number, unknown>, i: number) => m[i] !== undefined;
  const count = (m: Record<number, unknown>) => Object.keys(m).length;
  const phase = count(c.round1) < c.n ? 0 : count(c.round2) < c.n ? 1 : count(c.result) < c.n ? 2 : 3;
  const done = phase === 3;

  /** Run one player's step for the current phase and log what crossed the wire. */
  const act = (state: Ceremony, i: number): Ceremony => {
    const who = nameOf(state, i);
    if (phase === 0) {
      const next = dkgCommit(state, i);
      log({ actor: who, kind: "broadcast", text: "DKG round 1 → everyone: commitments + proof of knowledge", bytes: bytes(next.round1[i].package) });
      return next;
    }
    if (phase === 1) {
      const next = dkgDeal(state, i);
      for (const [to, pkg] of Object.entries(next.round2[i].packages)) {
        log({ actor: who, kind: "private", text: `DKG round 2 → ${nameOf(state, Number(to))} only (secret share)`, bytes: bytes(pkg) });
      }
      return next;
    }
    const next = dkgFinish(state, i);
    log({ actor: who, kind: "local", text: `verified ${state.n - 1} shares, derived own key share. Group key ${next.result[i].group_key.slice(0, 10)}…` });
    return next;
  };

  const run = (indices: number[]) => {
    setError(null);
    try {
      let next = c;
      for (const i of indices) next = act(next, i);
      setCeremony(next);
      const finished = Object.keys(next.result).length === next.n;
      if (finished) {
        log(
          everyoneAgrees(next)
            ? { actor: "Table", kind: "success", text: `all ${next.n} players derived the same group key. Nobody ever held its private key.` }
            : { actor: "Table", kind: "failure", text: "players disagree on the group key" },
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      log({ actor: "Engine", kind: "failure", text: msg });
    }
  };

  const pendingNow = c.players.filter((p) =>
    phase === 0 ? !has(c.round1, p.index) : phase === 1 ? !has(c.round2, p.index) : phase === 2 ? !has(c.result, p.index) : false,
  );
  const verb = ["Commit", "Deal shares", "Derive key"][phase] ?? "";

  return (
    <div className="space-y-8">
      <LevelHeader
        level={1}
        title={
          <>
            Key Ceremony. <em className="text-glacier">Make a key nobody holds.</em>
          </>
        }
        lesson={`${c.n} players run distributed key generation (DKG). At the end there is one group public key, and any ${c.t} of you can sign for it. The full private key is never computed anywhere, not even in this tab.`}
      >
        <Stepper steps={STEPS} current={phase} done={done} />
      </LevelHeader>

      {/* Players */}
      <section aria-label="Players" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {c.players.map((p) => {
          const did = phase === 0 ? has(c.round1, p.index) : phase === 1 ? has(c.round2, p.index) : has(c.result, p.index);
          const state = done ? "done" : did ? "done" : "active";
          return (
            <div key={p.index} className="panel flex items-center gap-4 p-4">
              <Avatar name={p.name} state={state} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {p.name} <span className="font-mono text-xs text-moss-deep">#{p.index}</span>
                </p>
                <p className="truncate text-xs text-moss">
                  {done
                    ? "holds a key share"
                    : did
                      ? ["committed", "shares dealt", "key derived"][phase]
                      : `your turn: ${verb.toLowerCase()}`}
                </p>
              </div>
              {!done && !did && (
                <button
                  type="button"
                  onClick={() => run([p.index])}
                  className="rounded-full border border-glacier/40 px-3.5 py-1.5 text-xs font-semibold text-glacier transition-colors hover:bg-glacier hover:text-ink"
                >
                  {verb}
                </button>
              )}
              {(done || did) && <CheckIcon className="size-4 text-glacier" />}
            </div>
          );
        })}
      </section>

      {!done && (
        <ActionBar>
          <PrimaryButton onClick={() => run(pendingNow.map((p) => p.index))}>
            {verb} for everyone left ({pendingNow.length}) <ArrowIcon />
          </PrimaryButton>
          <span className="text-sm text-moss">or pass the screen and let each player tap their own card.</span>
        </ActionBar>
      )}
      {error && <p className="font-mono text-sm text-ember">{error}</p>}

      {/* What crossed the wire */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel p-6" aria-label="Messages">
          {phase === 0 && <Round1Board c={c} />}
          {phase === 1 && <Round2Board c={c} />}
          {phase >= 2 && <ResultBoard c={c} />}
        </section>

        <div className="space-y-4">
          {phase === 0 && (
            <Explain title="What's happening">
              <p>Each player invents a random secret polynomial. Its constant term is their contribution to the group secret.</p>
              <p>They broadcast <b>commitments</b> to that polynomial, plus a zero-knowledge proof that they know the secret behind it. Nothing secret leaves the device.</p>
            </Explain>
          )}
          {phase === 1 && (
            <Explain title="What's happening">
              <p>Each player evaluates their polynomial at every other player&apos;s number and sends that value <b>privately</b>.</p>
              <p>These are the only secret messages in the whole ceremony. In room mode they are encrypted to the recipient before they touch the relay. Here, on one shared screen, they stay in this tab.</p>
            </Explain>
          )}
          {phase === 2 && (
            <Explain title="What's happening">
              <p>Each player checks every share they received against the round-1 commitments, so anyone who lied would be named.</p>
              <p>Then they add the shares up. The sum is their <b>key share</b>. Everyone also computes the same group public key.</p>
            </Explain>
          )}
          {done && (
            <Explain title="What you just did">
              <p>
                {c.n} devices agreed on one public key, and the private key behind it has never existed in one place. Any {c.t} of
                you can sign. {c.t - 1} {c.t - 1 === 1 ? "player" : "players"} can&apos;t, and learn nothing about the key.
              </p>
            </Explain>
          )}
          {done && (
            <ActionBar>
              <PrimaryButton onClick={onNext}>
                Level 2: Catch the Cheater <ArrowIcon />
              </PrimaryButton>
            </ActionBar>
          )}
        </div>
      </div>
    </div>
  );
}

function Round1Board({ c }: { c: Ceremony }) {
  const entries = c.players.filter((p) => c.round1[p.index]);
  return (
    <>
      <p className="eyebrow">Public board · round 1 broadcasts</p>
      {entries.length === 0 && <p className="mt-4 text-sm text-moss">Nothing broadcast yet.</p>}
      <ul className="mt-4 space-y-2">
        {entries.map((p) => (
          <li key={p.index} className="flex flex-wrap items-center gap-3 rounded-xl border border-glacier/10 bg-ink/60 px-3 py-2">
            <Avatar name={p.name} state="done" size="sm" />
            <span className="text-sm">
              {p.name} <span className="text-moss">→ everyone</span>
            </span>
            <HexChip hex={c.round1[p.index].package} />
            <span className="ml-auto font-mono text-[0.65rem] text-moss-deep">{bytes(c.round1[p.index].package)} B</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Round2Board({ c }: { c: Ceremony }) {
  return (
    <>
      <p className="eyebrow">Private envelopes · round 2</p>
      <p className="mt-2 text-xs text-moss">Row = sender, column = recipient. Each cell is a secret share only its recipient may open.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-center text-xs">
          <thead>
            <tr>
              <th className="w-20" />
              {c.players.map((p) => (
                <th key={p.index} className="pb-1 font-medium text-moss">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.players.map((from) => (
              <tr key={from.index}>
                <th className="pr-2 text-left font-medium text-moss">{from.name}</th>
                {c.players.map((to) => {
                  const pkg = c.round2[from.index]?.packages[to.index];
                  return (
                    <td
                      key={to.index}
                      className={[
                        "h-10 rounded-lg border font-mono text-[0.6rem]",
                        from.index === to.index
                          ? "border-transparent text-moss-deep"
                          : pkg
                            ? "border-glacier/30 bg-glacier/10 text-glacier"
                            : "border-bone/10 text-moss-deep",
                      ].join(" ")}
                      title={pkg ? `${bytes(pkg)} bytes, sealed for ${to.name}` : undefined}
                    >
                      {from.index === to.index ? "·" : pkg ? "sealed" : "…"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ResultBoard({ c }: { c: Ceremony }) {
  const gk = groupKey(c);
  const finished = c.players.filter((p) => c.result[p.index]);
  return (
    <>
      <p className="eyebrow !text-brass">Group public key</p>
      {gk ? (
        <p className="mt-3 break-all rounded-xl border border-brass/30 bg-brass/[0.06] p-4 font-mono text-sm text-brass">{gk}</p>
      ) : (
        <p className="mt-3 text-sm text-moss">Appears when the first player finishes.</p>
      )}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {finished.map((p) => {
          const same = c.result[p.index].group_key === gk;
          return (
            <li key={p.index} className="flex items-center gap-2 text-sm">
              <Avatar name={p.name} state={same ? "done" : "bad"} size="sm" />
              {p.name}
              <span className={`ml-auto font-mono text-[0.65rem] ${same ? "text-glacier" : "text-ember"}`}>
                {same ? "same key ✓" : "MISMATCH"}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
