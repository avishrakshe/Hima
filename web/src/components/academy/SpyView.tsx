"use client";

/**
 * Lesson 1 · The Spy's View: what a public observer learns from each Zcash
 * transaction type. Field visibility follows how Zcash actually works:
 *   t→t transparent  : sender, receiver, amount public; no memo possible
 *   t→z shielding    : sender + amount entering the pool public; receiver + memo hidden
 *   z→t deshielding  : receiver + amount leaving the pool public; sender hidden
 *   z→z fully shielded: only "a transaction happened" + the fee
 * Addresses shown are illustrative, not real.
 */

import { useState } from "react";
import { agentById, art } from "@/lib/agents";
import { completeLesson } from "@/lib/academy";
import { sfx } from "../game/fx";
import { BigButton, Narrator, Portrait, Tech } from "../game/play-ui";

type Side = "t" | "z";
const ADDR: Record<Side, { from: string; to: string; label: string }> = {
  t: { from: "t1Orch…7Kq", to: "t1Sapl…4Wn", label: "Transparent" },
  z: { from: "u1orch…9xm", to: "u1sapl…2fe", label: "Shielded" },
};

const KINDS = {
  tt: { name: "Transparent", privacy: 0, color: "#ff7a45", line: "Everyone sees everything, like a postcard." },
  tz: { name: "Shielding", privacy: 55, color: "#f4b728", line: "Money goes INTO the shielded pool. Vex sees who put it in, but not where it goes." },
  zt: { name: "Deshielding", privacy: 45, color: "#f4b728", line: "Money comes OUT of the pool. Vex sees who received it, but not who sent it." },
  zz: { name: "Fully shielded", privacy: 100, color: "#9fe7d4", line: "Vex only learns that something happened. That's real privacy." },
} as const;
type KindId = keyof typeof KINDS;

type Sent = { from: Side; to: Side; amount: number; memo: string; n: number };

export function SpyView({ onDone }: { onDone: () => void }) {
  const [from, setFrom] = useState<Side>("t");
  const [to, setTo] = useState<Side>("t");
  const [amount, setAmount] = useState(1.5);
  const [memo, setMemo] = useState("Thanks for the lemonade! 🍋");
  const [sent, setSent] = useState<Sent | null>(null);
  const [tried, setTried] = useState<Set<KindId>>(new Set());

  const orchard = agentById("orchard");
  const sapling = agentById("sapling");
  const kindId = sent ? (`${sent.from}${sent.to}` as KindId) : null;
  const kind = kindId ? KINDS[kindId] : null;
  const allTried = tried.size === 4;

  const send = () => {
    const k = `${from}${to}` as KindId;
    setSent((s) => ({ from, to, amount, memo, n: (s?.n ?? 0) + 1 }));
    sfx(k === "zz" ? "magic" : "whoosh");
    const next = new Set(tried).add(k);
    setTried(next);
    if (next.size === 4) completeLesson("spy");
  };

  const rows = sent
    ? [
        { k: "From", v: sent.from === "t" ? ADDR.t.from : null },
        { k: "To", v: sent.to === "t" ? ADDR.t.to : null },
        { k: "Amount", v: sent.from === "t" || sent.to === "t" ? `${sent.amount.toFixed(2)} ZEC` : null },
        {
          k: "Memo",
          v: sent.to === "t" ? "none (transparent addresses can't get memos)" : null,
        },
        { k: "Fee", v: "0.0001 ZEC" },
      ]
    : [];

  const picker = (value: Side, onChange: (s: Side) => void, who: string) => (
    <div className="flex gap-2">
      {(["t", "z"] as Side[]).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => { sfx("tap"); onChange(s); }}
          aria-pressed={value === s}
          aria-label={`${who}: ${ADDR[s].label}`}
          className={`cut-sm border-2 px-3 py-2 text-left transition-all ${value === s ? (s === "z" ? "border-glacier bg-glacier/10" : "border-ember bg-ember/10") : "border-white/10 hover:border-white/30"}`}
        >
          <span className="font-display block text-base tracking-wide text-cream">{s === "t" ? "👁️ Glass" : "🛡️ Shielded"}</span>
          <span className="block font-mono text-[0.6rem] text-cream/50">{s === "t" ? "t1… address" : "u1… address"}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Narrator who="orchard" tech="Transparent (t-addr) transactions publish inputs, outputs and values. Shielded Sapling/Orchard outputs encrypt recipient, value and memo; transfers between pools reveal the value crossing the boundary.">
        Orchard wants to pay Sapling for lemonade. 🍋 But <b>Vex</b> reads the public blockchain all day! Pick how each
        side pays, hit <b>Send</b>, and watch what Vex can see. <b>Try all 4 combos</b> to finish the lesson.
      </Narrator>

      {/* Controls */}
      <div className="cut grid gap-5 bg-night-2/90 p-5 md:grid-cols-[1fr_1fr_1.2fr]">
        <div>
          <p className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold">
            <Portrait img={art("orchard", "sm")} face={orchard.face} size={24} /> Orchard pays from
          </p>
          <div className="mt-2">{picker(from, setFrom, "Sender")}</div>
        </div>
        <div>
          <p className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold">
            <Portrait img={art("sapling", "sm")} face={sapling.face} size={24} /> Sapling receives at
          </p>
          <div className="mt-2">{picker(to, setTo, "Receiver")}</div>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="flex justify-between font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold">
              Amount <span className="text-cream">{amount.toFixed(2)} ZEC</span>
            </span>
            <input type="range" min={0.1} max={10} step={0.1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-2 w-full accent-[#f4b728]" />
          </label>
          <label className="block">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold">Secret memo</span>
            <input value={memo} maxLength={60} onChange={(e) => setMemo(e.target.value)} className="mt-1 w-full border border-white/15 bg-night px-3 py-2 text-sm text-cream outline-none focus:border-gold" />
          </label>
        </div>
      </div>

      <div className="flex justify-center">
        <BigButton tone="brass" onClick={send}>Send {amount.toFixed(2)} ZEC →</BigButton>
      </div>

      {/* The street */}
      <div className="cut relative h-40 overflow-hidden bg-night-2">
        <div className="absolute inset-y-0 left-[12%] right-[12%] top-1/2 h-12 -translate-y-1/2 border-y border-glacier/30 bg-glacier/[0.06]" />
        {sent && (
          <span
            key={sent.n}
            className="absolute top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-gold font-display text-sm text-night shadow-[0_0_24px_rgba(244,183,40,0.7)]"
            style={{ animation: "coin-travel 1.8s cubic-bezier(0.45,0,0.2,1) both" }}
          >
            ⓩ
          </span>
        )}
        {/* Shielded tunnels hide the coin */}
        {sent && sent.from === "z" && <Tunnel side="left" full={sent.to === "z"} />}
        {sent && sent.to === "z" && sent.from !== "z" && <Tunnel side="right" full={false} />}
        <div className="absolute left-3 top-1/2 z-20 -translate-y-1/2 text-center">
          <Portrait img={art("orchard", "sm")} face={orchard.face} size={64} ring={orchard.color} />
          <p className="mt-1 font-mono text-[0.6rem] text-cream/60">{ADDR[sent?.from ?? from].from}</p>
        </div>
        <div className="absolute right-3 top-1/2 z-20 -translate-y-1/2 text-center">
          <Portrait img={art("sapling", "sm")} face={sapling.face} size={64} ring={sapling.color} />
          <p className="mt-1 font-mono text-[0.6rem] text-cream/60">{ADDR[sent?.to ?? to].to}</p>
        </div>
      </div>

      {/* What Vex sees */}
      <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
        <div className="cut bg-night-2/90 p-5">
          <p className="flex items-center gap-3 font-display text-2xl text-cream">
            <Portrait img={art("vex", "sm")} face={agentById("vex").face} size={40} ring="#ff7a45" />
            What Vex sees on the blockchain
          </p>
          {!sent && <p className="mt-4 text-cream/50">Send something first…</p>}
          {sent && kind && (
            <>
              <dl key={sent.n} className="mt-4 divide-y divide-white/10">
                {rows.map((r) => (
                  <div key={r.k} className="pop-in flex items-center justify-between gap-4 py-2.5">
                    <dt className="font-mono text-xs uppercase tracking-[0.2em] text-cream/50">{r.k}</dt>
                    <dd className={`text-right font-mono text-sm ${r.v ? "text-ember" : "text-glacier"}`}>
                      {r.v ?? "🔒 hidden"}
                    </dd>
                  </div>
                ))}
              </dl>
              {sent.to === "z" && (
                <p className="mt-3 text-sm text-cream/60">
                  Sapling&apos;s wallet decrypts the memo: <span className="text-cream">“{sent.memo}”</span>
                </p>
              )}
            </>
          )}
        </div>
        <div className="cut flex flex-col gap-4 bg-night-2/90 p-5">
          {kind ? (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-cream/50">Transaction type</p>
              <p className="font-display text-4xl" style={{ color: kind.color }}>{kind.name}</p>
              <p className="text-cream/80">{kind.line}</p>
              <div>
                <p className="flex justify-between font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cream/50">
                  Privacy <span>{kind.privacy}%</span>
                </p>
                <div className="mt-1.5 h-2 bg-white/10">
                  <div key={sent?.n} className="bar-fill h-full" style={{ width: `${Math.max(kind.privacy, 3)}%`, background: kind.color }} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-cream/50">The transaction type appears here.</p>
          )}
          <div className="mt-auto flex flex-wrap gap-2">
            {(Object.keys(KINDS) as KindId[]).map((k) => (
              <span key={k} className={`cut-sm px-2.5 py-1 font-mono text-[0.65rem] ${tried.has(k) ? "bg-gold text-night" : "bg-white/5 text-cream/40"}`}>
                {tried.has(k) ? "✓ " : ""}{KINDS[k].name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {allTried && (
        <div className="flex flex-col items-center gap-3">
          <Narrator who="orchard" mood="wow">
            You tried them all! 🎉 The secret: <b>shielded → shielded</b> hides the most. Use <b>u1…</b> addresses and keep
            your ZEC in the shielded pool.
          </Narrator>
          <Tech>Wallets should label these four types before you hit send. Many users can&apos;t tell them apart today.</Tech>
          <BigButton onClick={onDone}>Collect your cards 🃏</BigButton>
        </div>
      )}
    </div>
  );
}

function Tunnel({ side, full }: { side: "left" | "right"; full: boolean }) {
  const style = full ? { left: "12%", right: "12%" } : side === "left" ? { left: "12%", right: "50%" } : { left: "50%", right: "12%" };
  return (
    <div
      className="absolute top-1/2 z-[15] flex h-16 -translate-y-1/2 items-center justify-center border-y-2 border-glacier/60 bg-[repeating-linear-gradient(135deg,#0b0f14_0_10px,#121821_10px_20px)] shadow-[0_0_30px_rgba(159,231,212,0.25)]"
      style={style}
    >
      <span className="font-display text-sm tracking-[0.3em] text-glacier">🛡️ Shielded pool</span>
    </div>
  );
}
