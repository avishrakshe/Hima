"use client";

/**
 * "Not a mockup": runs the real re-randomized FROST protocol (frost-wasm) in the
 * visitor's browser and shows the results. A 5-player DKG, two signatures and a
 * cheater, all on this device.
 */

import Link from "next/link";
import { useState } from "react";
import type { SelfTestReport } from "@/lib/frost";
import { AlertIcon, CheckIcon } from "./icons";

const NAMES = ["Asha", "Kabir", "Meera", "Rohan", "Zoya"];
const short = (hex: string) => `${hex.slice(0, 10)}…${hex.slice(-6)}`;

type Result = {
  ms: number;
  version: string;
  report: SelfTestReport;
};

type State = { kind: "idle" } | { kind: "running" } | { kind: "done"; result: Result } | { kind: "error"; message: string };

export function LiveProof() {
  const [state, setState] = useState<State>({ kind: "idle" });

  const run = async () => {
    setState({ kind: "running" });
    try {
      // Loaded on demand so the landing page never pays for the 500 KB module up front.
      const { loadFrost, frost } = await import("@/lib/frost");
      await loadFrost();
      await new Promise((r) => requestAnimationFrame(() => r(null))); // let the spinner paint
      const t0 = performance.now();
      const report = frost.selfTest(5, 3);
      const ms = performance.now() - t0;
      setState({ kind: "done", result: { ms, report, version: frost.version() } });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  const r = state.kind === "done" ? state.result.report : null;

  const checks = r
    ? [
        {
          pass: true,
          title: "Key ceremony",
          body: (
            <>
              5 players ran a 2-round DKG and agreed on one group key{" "}
              <code className="text-brass">{short(r.group_key)}</code>
            </>
          ),
        },
        {
          pass: r.verifies_under_randomized_key,
          title: "3-of-5 signature",
          body: (
            <>
              Asha, Kabir and Meera signed. It verifies under the randomized key{" "}
              <code className="text-glacier">{short(r.randomized_key_1)}</code>
            </>
          ),
        },
        {
          pass: !r.verifies_under_group_key,
          title: "Unlinkable",
          body: <>The same signature does not verify under the group key. Outsiders can&apos;t tie it to the group.</>,
        },
        {
          pass: r.randomized_keys_differ,
          title: "Fresh key every time",
          body: (
            <>
              A second signature used <code className="text-glacier">{short(r.randomized_key_2)}</code>
            </>
          ),
        },
        {
          pass: r.culprits_named.length === 1 && r.culprits_named[0] === r.cheater,
          title: "Cheater caught",
          body: (
            <>
              {NAMES[r.cheater - 1]} signed a different message (simulated). Aggregation refused and named
              player {r.culprits_named.join(", ")}.
            </>
          ),
        },
      ]
    : [];

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-6 border-b border-glacier/10 p-7 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow !text-brass">Not a mockup</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">
            Run the real protocol <em className="font-serif font-normal text-glacier">in this browser.</em>
          </h3>
          <p className="mt-2 max-w-xl text-moss">
            The Zcash Foundation&apos;s FROST v3 (re-randomized RedPallas), compiled to WebAssembly. One click
            runs a full 5-player game on your device. Nothing leaves this tab.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={state.kind === "running"}
          className="btn btn-primary shrink-0 disabled:cursor-wait disabled:opacity-70"
        >
          {state.kind === "running" ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" /> Running…
            </>
          ) : state.kind === "done" ? (
            "Run again"
          ) : (
            "Run real FROST"
          )}
        </button>
      </div>

      <div className="p-7" aria-live="polite">
        {state.kind === "idle" && (
          <p className="font-mono text-sm text-moss-deep">
            › waiting. Loads a ~500 KB WebAssembly module on click.
          </p>
        )}
        {state.kind === "running" && (
          <p className="font-mono text-sm text-glacier">› generating keys, signing, verifying…</p>
        )}
        {state.kind === "error" && (
          <p className="flex items-center gap-2 font-mono text-sm text-ember">
            <AlertIcon /> {state.message}
          </p>
        )}
        {state.kind === "done" && (
          <>
            <ul className="grid gap-3 md:grid-cols-2">
              {checks.map((c) => (
                <li key={c.title} className="flex gap-3 rounded-xl border border-glacier/10 bg-ink/60 p-4">
                  <span
                    className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${c.pass ? "bg-glacier text-ink" : "bg-ember text-ink"}`}
                  >
                    {c.pass ? <CheckIcon className="size-3.5" /> : <AlertIcon className="size-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{c.title}</p>
                    <p className="mt-0.5 break-words text-sm text-moss">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.7rem] text-moss-deep">
              <span>{state.result.ms.toFixed(0)} ms on this device</span>
              <span>{state.result.version}</span>
              <span>demo message, not a transaction · unaudited</span>
            </p>
            <Link href="/play" className="btn btn-primary mt-6">
              Now play it step by step
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
