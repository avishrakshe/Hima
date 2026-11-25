"use client";

/**
 * Lesson 3 · The Glass Key: viewing keys and selective disclosure.
 * A viewing key reveals shielded payments (amounts + memos) but grants no
 * spending authority. Payments below are illustrative.
 */

import { useState } from "react";
import { agentById, art } from "@/lib/agents";
import { completeLesson } from "@/lib/academy";
import { sfx } from "../game/fx";
import { BigButton, Narrator, Portrait, Tech } from "../game/play-ui";

const PAYMENTS = [
  { amount: 0.25, memo: "2 lemonades please 🍋" },
  { amount: 0.5, memo: "For the school trip fund" },
  { amount: 0.1, memo: "Tip! Best lemonade ever" },
  { amount: 1.2, memo: "Chess club order × 8" },
];
const TOTAL = PAYMENTS.reduce((a, p) => a + p.amount, 0);

type Viewer = "vex" | "warden" | "sapling";

export function GlassKey({ onDone }: { onDone: () => void }) {
  const [viewer, setViewer] = useState<Viewer>("vex");
  const [keyGiven, setKeyGiven] = useState(false);
  const [triedSpend, setTriedSpend] = useState(false);
  const [denied, setDenied] = useState(0);

  const canSee = viewer === "sapling" || (viewer === "warden" && keyGiven);
  const canSpend = viewer === "sapling";
  const done = keyGiven && triedSpend;

  const give = () => {
    setKeyGiven(true);
    setViewer("warden");
    sfx("magic");
  };

  const spend = () => {
    if (canSpend) {
      sfx("success");
      return;
    }
    setDenied((d) => d + 1);
    sfx("fail");
    if (viewer === "warden" && keyGiven) {
      setTriedSpend(true);
      completeLesson("glass");
    }
  };

  const who = agentById(viewer);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Narrator who="sapling" tech="Zcash has incoming viewing keys (see received notes and memos) and full viewing keys (also see outgoing). Neither can authorize spends; that needs the spending key.">
        I run a lemonade stand and get paid in <b>shielded ZEC</b>. 🍋 The school treasurer, <b>Warden</b>, needs to check my
        sales. I can give him a <b>Glass Key</b> (a viewing key): he can <b>look</b>, but he can never <b>spend</b>. Try it!
      </Narrator>

      <div className="grid gap-5 md:grid-cols-[260px_1fr]">
        {/* Who is looking */}
        <div className="cut flex flex-col gap-2 bg-night-2/90 p-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold">Look through the eyes of…</p>
          {(["vex", "warden", "sapling"] as Viewer[]).map((v) => {
            const a = agentById(v);
            const label = v === "vex" ? "the public" : v === "warden" ? (keyGiven ? "has the Glass Key 🔑" : "no key yet") : "the owner";
            return (
              <button
                key={v}
                type="button"
                onClick={() => { sfx("tap"); setViewer(v); }}
                aria-pressed={viewer === v}
                className={`cut-sm flex items-center gap-3 border-2 px-3 py-2 text-left transition-colors ${viewer === v ? "border-gold bg-gold/10" : "border-white/10 hover:border-white/30"}`}
              >
                <Portrait img={art(v, "sm")} face={a.face} size={40} ring={a.color} />
                <span>
                  <span className="font-display block text-lg text-cream">{a.name}</span>
                  <span className="block text-xs text-cream/50">{label}</span>
                </span>
              </button>
            );
          })}
          {!keyGiven && (
            <div className="mt-3">
              <BigButton tone="brass" onClick={give}>Give Warden the Glass Key 🔑</BigButton>
            </div>
          )}
        </div>

        {/* Wallet view */}
        <div key={`${viewer}-${keyGiven}`} className="cut flip-in bg-night-2/90 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-2xl text-cream">
              Sapling&apos;s lemonade wallet <span className="text-cream/40">· seen by {who.name}</span>
            </p>
            <span className={`cut-sm px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] ${canSee ? "bg-glacier text-night" : "bg-white/10 text-cream/50"}`}>
              {canSpend ? "spending key" : canSee ? "viewing key" : "public chain"}
            </span>
          </div>
          <ul className="mt-4 divide-y divide-white/10">
            {PAYMENTS.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-3">
                <span className="font-mono text-sm text-cream/40">payment #{i + 1}</span>
                <span className={`flex-1 text-sm ${canSee ? "text-cream/80" : "text-cream/30"}`}>{canSee ? `“${p.memo}”` : "🔒 encrypted memo"}</span>
                <span className={`font-mono text-sm ${canSee ? "text-gold" : "text-cream/30"}`}>{canSee ? `+${p.amount.toFixed(2)} ZEC` : "🔒 ??? ZEC"}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="text-cream/70">
              Total: <b className="font-mono text-gold">{canSee ? `${TOTAL.toFixed(2)} ZEC` : "🔒 hidden"}</b>
            </p>
            <button
              key={denied}
              type="button"
              onClick={spend}
              className={`cut-sm font-display px-5 py-2 text-lg tracking-wide ${canSpend ? "bg-glacier text-night" : "bg-ember/20 text-ember"} ${denied && !canSpend ? "hit" : ""}`}
            >
              Try to spend 1 ZEC
            </button>
          </div>
          {denied > 0 && !canSpend && (
            <p className="pop-in mt-3 text-sm text-ember">
              🚫 {viewer === "vex" ? "Vex has no keys at all." : keyGiven ? "Denied! A Glass Key can only LOOK. Spending needs Sapling's spending key." : "Warden has no key yet."}
            </p>
          )}
        </div>
      </div>

      {done && (
        <div className="flex flex-col items-center gap-3">
          <Narrator who="warden" mood="wow">
            I checked every sale and couldn&apos;t touch a single coin. 🛡️ That&apos;s <b>selective disclosure</b>: Zcash is
            private by default, and <b>you</b> choose who gets to look.
          </Narrator>
          <Tech>Useful for audits, taxes and donations: share a viewing key instead of making the whole history public.</Tech>
          <BigButton onClick={onDone}>Collect your cards 🃏</BigButton>
        </div>
      )}
    </div>
  );
}
