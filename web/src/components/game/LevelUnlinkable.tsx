"use client";

import { useMemo, useState } from "react";
import { textToHex } from "@/lib/frost";
import { groupKey, nameOf, signAll, verify, type Attempt, type Ceremony } from "@/lib/game/engine";
import { ArrowIcon, CheckIcon } from "../icons";
import { ActionBar, Avatar, Explain, HexChip, LevelHeader, PrimaryButton, Stepper, type PushLog } from "./kit";

const STEPS = [
  { key: "a", label: "Signature A" },
  { key: "b", label: "Signature B" },
  { key: "check", label: "Try to link them" },
];

const MESSAGE = "PU DAO: approve the club's chai budget";

export function LevelUnlinkable({
  ceremony: c,
  log,
  onNext,
}: {
  ceremony: Ceremony;
  log: PushLog;
  onNext: () => void;
}) {
  const indices = c.players.map((p) => p.index);
  const setA = indices.slice(0, c.t);
  const setB = indices.slice(-c.t); // a different signer set whenever n > t
  const messageHex = useMemo(() => textToHex(MESSAGE), []);
  const gk = groupKey(c)!;

  const [sigA, setSigA] = useState<Attempt | null>(null);
  const [sigB, setSigB] = useState<Attempt | null>(null);
  const [guess, setGuess] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sign = (signers: number[], label: "A" | "B") => {
    setError(null);
    try {
      const a = signAll(c, signers, messageHex);
      if (!a.outcome?.ok) throw new Error(a.outcome?.error ?? "signing failed");
      log({
        actor: "Coordinator",
        kind: "success",
        text: `signature ${label} by ${signers.map((i) => nameOf(c, i)).join(", ")} under fresh key ${a.outcome.randomized_key!.slice(0, 10)}…`,
      });
      (label === "A" ? setSigA : setSigB)(a);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      log({ actor: "Engine", kind: "failure", text: msg });
    }
  };

  const step = !sigA ? 0 : !sigB ? 1 : 2;

  // Real verification of both signatures against all three keys.
  const matrix = useMemo(() => {
    if (!sigA?.outcome?.ok || !sigB?.outcome?.ok) return null;
    const keys = [
      { label: "Group key", hex: gk, tone: "brass" as const },
      { label: "Key A", hex: sigA.outcome.randomized_key!, tone: "glacier" as const },
      { label: "Key B", hex: sigB.outcome.randomized_key!, tone: "glacier" as const },
    ];
    const sigs = [
      { label: "Signature A", hex: sigA.outcome.signature! },
      { label: "Signature B", hex: sigB.outcome.signature! },
    ];
    return { keys, sigs, cells: sigs.map((s) => keys.map((k) => verify(k.hex, messageHex, s.hex))) };
  }, [sigA, sigB, gk, messageHex]);

  return (
    <div className="space-y-8">
      <LevelHeader
        level={4}
        title={
          <>
            Unlinkable. <em className="text-glacier">Same group, strangers on-chain.</em>
          </>
        }
        lesson="Sign the same message twice with re-randomized FROST, then try to prove both signatures came from your group. On Zcash, this is what lets a threshold spend look like any other Orchard spend."
      >
        <Stepper steps={STEPS} current={step} done={!!guess} />
      </LevelHeader>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ["A", setA, sigA],
                ["B", setB, sigB],
              ] as const
            ).map(([label, signers, sig]) => (
              <div key={label} className="panel flex flex-col gap-4 p-5">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Signature {label}</p>
                  <div className="flex -space-x-2">
                    {signers.map((i) => (
                      <Avatar key={i} name={nameOf(c, i)} state={sig ? "done" : "idle"} size="sm" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-moss">Signed by {signers.map((i) => nameOf(c, i)).join(", ")}</p>
                {sig?.outcome?.ok ? (
                  <div className="space-y-2">
                    <HexChip hex={sig.outcome.signature!} tone="moss" label="sig" />
                    <div>
                      <HexChip hex={sig.outcome.randomized_key!} label={`key ${label}`} />
                    </div>
                  </div>
                ) : (
                  <PrimaryButton
                    onClick={() => sign([...signers], label)}
                    disabled={label === "B" && !sigA}
                  >
                    Sign {label} <ArrowIcon />
                  </PrimaryButton>
                )}
              </div>
            ))}
          </div>

          {matrix && (
            <div className="panel overflow-x-auto p-5">
              <p className="eyebrow">Live verification · real RedPallas checks</p>
              <table className="mt-4 w-full min-w-[420px] border-separate border-spacing-1.5 text-sm">
                <thead>
                  <tr>
                    <th />
                    {matrix.keys.map((k) => (
                      <th key={k.label} className="pb-1 text-left font-medium">
                        <span className={k.tone === "brass" ? "text-brass" : "text-glacier"}>{k.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.sigs.map((s, r) => (
                    <tr key={s.label}>
                      <th className="pr-2 text-left font-medium text-moss">{s.label}</th>
                      {matrix.cells[r].map((ok, col) => (
                        <td
                          key={col}
                          className={`rounded-lg border px-3 py-2 font-mono text-xs ${ok ? "border-glacier/40 bg-glacier/10 text-glacier" : "border-bone/10 text-moss-deep"}`}
                        >
                          {ok ? "✓ verifies" : "✗ fails"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-moss">
                Each signature verifies only under its own one-time key, and fails under the group key.
              </p>
            </div>
          )}

          {matrix && (
            <div className="panel space-y-4 p-5">
              <p className="eyebrow !text-ember">You&apos;re the chain analyst</p>
              <p className="text-sm text-moss">
                You see Key A, Key B and the group key. Can you tell that A and B both belong to this group?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setGuess("yes")}
                  className={`rounded-full border px-4 py-2 text-sm ${guess === "yes" ? "border-ember/60 bg-ember/15 text-ember" : "border-bone/15 text-moss hover:text-bone"}`}
                >
                  Yes, I can link them
                </button>
                <button
                  type="button"
                  onClick={() => setGuess("no")}
                  className={`rounded-full border px-4 py-2 text-sm ${guess === "no" ? "border-glacier/60 bg-glacier/15 text-glacier" : "border-bone/15 text-moss hover:text-bone"}`}
                >
                  No, they look unrelated
                </button>
              </div>
              {guess && (
                <p className="text-sm text-bone">
                  {guess === "no" ? "Right. " : "How? "}
                  Each one-time key is the group key plus a random point (α·G), and α is never published. Without α,
                  Key A, Key B and the group key are just three unrelated-looking points.
                </p>
              )}
              {guess && (
                <ActionBar>
                  <PrimaryButton onClick={onNext}>
                    Finish <CheckIcon />
                  </PrimaryButton>
                </ActionBar>
              )}
            </div>
          )}
          {error && <p className="font-mono text-sm text-ember">{error}</p>}
        </section>

        <div className="space-y-4">
          <Explain title="Why randomize?">
            <p>
              Plain FROST signatures all verify under the same group key, so anyone could cluster every payment the group
              ever made.
            </p>
            <p>
              Re-randomized FROST adds a fresh random α to every signing round. The signature verifies under{" "}
              <b>group key + α·G</b>, a key used exactly once.
            </p>
          </Explain>
          {matrix && (
            <Explain title="On Zcash">
              <p>
                Every Orchard spend already publishes a one-time randomized key (rk). Re-randomized FROST produces exactly
                that kind of signature, so a group spend is indistinguishable from a single-signer one. The spec is ZIP 312
                (still a draft).
              </p>
            </Explain>
          )}
          <p className="font-mono text-[0.65rem] text-moss-deep">message: “{MESSAGE}” · demo, not a transaction</p>
        </div>
      </div>
    </div>
  );
}
