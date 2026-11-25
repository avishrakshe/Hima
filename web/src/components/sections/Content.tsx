import type { ReactNode } from "react";
import { site } from "@/lib/site";
import { Wordmark } from "../Logo";
import { ThresholdDemo } from "../ThresholdDemo";
import { LiveProof } from "../LiveProof";
import { Reveal } from "../ui";
import { ArrowIcon, GitHubIcon, XIcon } from "../icons";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function SectionHead({
  eyebrow,
  title,
  lede,
  dark = true,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  dark?: boolean;
}) {
  return (
    <Reveal className="max-w-3xl">
      <p className={dark ? "eyebrow" : "eyebrow !text-ember-deep"}>{eyebrow}</p>
      <h2 className="display mt-4 text-[clamp(2.3rem,4.6vw,4rem)]">{title}</h2>
      {lede && (
        <p className={`mt-5 text-lg leading-relaxed ${dark ? "text-moss" : "text-ink/70"}`}>{lede}</p>
      )}
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* 1. The idea                                                         */
/* ------------------------------------------------------------------ */

const moves = [
  {
    n: "01",
    title: "Make a key nobody holds",
    body: "Each phone invents a secret piece. Through two rounds of messages they agree on one public key, with no dealer and no moment when the whole key exists anywhere.",
    term: "Distributed key generation",
    art: <ArtCeremony />,
  },
  {
    n: "02",
    title: "Any three can sign. Two can't.",
    body: "Signing needs a threshold of shares. Lose a phone and the group still signs. Steal one and you get nothing, not even a hint about the key.",
    term: "t-of-n threshold Schnorr",
    art: <ArtThreshold />,
  },
  {
    n: "03",
    title: "Signatures that can't be traced",
    body: "Re-randomized FROST makes every signature verify under a fresh key, so outsiders can't link it to the group. That's how a threshold spend can look like any other Orchard spend.",
    term: "Re-randomized FROST · ZIP 312 (draft)",
    art: <ArtUnlinkable />,
  },
];

export function Idea() {
  return (
    <section id="idea" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="The idea"
          title={
            <>
              FROST is Zcash&apos;s next big primitive.{" "}
              <em className="text-glacier">Almost nobody can explain it.</em>
            </>
          }
          lede="FROST vaults, treasuries and multisigs are shipping. The people asked to hold the shares mostly don't know what a share is. Hima turns the protocol into three moves you can feel in a room full of phones."
        />

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {moves.map((m, i) => (
            <Reveal key={m.n} delay={i * 120}>
              <article className="panel tilt h-full overflow-hidden p-7">
                <div className="lift">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-glacier">{m.n}</span>
                    <span className="font-mono text-[0.62rem] uppercase tracking-widest text-moss-deep">
                      {m.term}
                    </span>
                  </div>
                  <div className="my-8 flex h-32 items-center justify-center">{m.art}</div>
                  <h3 className="text-xl font-semibold tracking-tight">{m.title}</h3>
                  <p className="mt-3 leading-relaxed text-moss">{m.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArtCeremony() {
  const pts = [0, 1, 2, 3, 4].map((i) => {
    const a = (-90 + i * 72) * (Math.PI / 180);
    return [60 + 46 * Math.cos(a), 60 + 46 * Math.sin(a)] as const;
  });
  return (
    <svg viewBox="0 0 120 120" className="h-full" aria-hidden="true">
      {pts.map(([x, y], i) =>
        pts.slice(i + 1).map(([x2, y2], j) => (
          <line key={`${i}-${j}`} x1={x} y1={y} x2={x2} y2={y2} stroke="#9fe7d4" strokeOpacity="0.22" />
        )),
      )}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="6" fill="#0b1916" stroke="#9fe7d4" strokeWidth="1.2" />
      ))}
      <path d="M60 50 70 60 60 70 50 60Z" fill="#e8b65a" />
    </svg>
  );
}

function ArtThreshold() {
  return (
    <svg viewBox="0 0 160 120" className="h-full" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const on = i < 3;
        return (
          <g key={i}>
            <rect
              x={8 + i * 30}
              y={30}
              width="22"
              height="22"
              rx="6"
              fill={on ? "#9fe7d4" : "#0b1916"}
              stroke="#9fe7d4"
              strokeOpacity={on ? 1 : 0.3}
            />
            <line
              x1={19 + i * 30}
              y1={56}
              x2={80}
              y2={92}
              stroke="#9fe7d4"
              strokeOpacity={on ? 0.6 : 0.1}
            />
          </g>
        );
      })}
      <circle cx="80" cy="96" r="9" fill="#e8b65a" />
    </svg>
  );
}

function ArtUnlinkable() {
  return (
    <svg viewBox="0 0 160 120" className="h-full" aria-hidden="true">
      <path d="M80 48 92 60 80 72 68 60Z" fill="#e8b65a" />
      {[
        [26, 26],
        [134, 30],
        [30, 96],
        [130, 94],
      ].map(([x, y], i) => (
        <g key={i}>
          <line x1="80" y1="60" x2={x} y2={y} stroke="#9fe7d4" strokeOpacity="0.25" strokeDasharray="2 5" />
          {/* broken link: the signature can't be traced back to the group key */}
          <g transform={`translate(${(80 + x) / 2} ${(60 + y) / 2})`} stroke="#ff7a45" strokeWidth="1.6" strokeLinecap="round">
            <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" />
            <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" />
          </g>
          <circle cx={x} cy={y} r="9" fill="#0b1916" stroke="#9fe7d4" strokeOpacity="0.7" />
          <text x={x} y={y + 3} textAnchor="middle" fontSize="8" fill="#9fe7d4" fontFamily="monospace">
            rk{i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Try the rule                                                     */
/* ------------------------------------------------------------------ */

export function TryIt() {
  return (
    <section id="try" className="relative border-y border-glacier/10 bg-ink-2/60 py-28 sm:py-36">
      <div aria-hidden="true" className="grid-lines absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Try the rule"
          title={
            <>
              Five players. One key. <em className="text-glacier">One cheater?</em>
            </>
          }
          lede="Choose a threshold, tap players to add their signature shares, then plant a cheater and watch the group catch them. This is the core loop of the game, in thirty seconds."
        />
        <Reveal className="mt-14">
          <ThresholdDemo />
        </Reveal>
        <Reveal id="proof" className="mt-16 scroll-mt-24">
          <p className="mb-5 text-center font-serif text-2xl italic text-moss">
            That was an illustration. This isn&apos;t.
          </p>
          <LiveProof />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Levels                                                           */
/* ------------------------------------------------------------------ */

const levels = [
  {
    n: 1,
    name: "Key Ceremony",
    status: "Core",
    play: "Every phone runs distributed key generation. Commitments and secret packages fly across the room, then one group public key appears. Nobody ever held it.",
    learn: "No trusted dealer. The key is born split.",
  },
  {
    n: 2,
    name: "Catch the Cheater",
    status: "Core",
    play: "One player is secretly told to send a corrupted signature share. Aggregation fails, and FROST v3's cheater detection names exactly who did it.",
    learn: "Identifiable aborts: misbehaviour has a name.",
  },
  {
    n: 3,
    name: "Old Shares",
    status: "Stretch",
    play: "Refresh everyone's shares, then try mixing old and new ones. They don't combine. But a full threshold of leaked old shares still signs, because the group key never changed.",
    learn: "What a share refresh protects, and what it doesn't.",
  },
  {
    n: 4,
    name: "Unlinkable",
    status: "Core",
    play: "Sign twice with re-randomized FROST. Each signature verifies under a fresh randomized key and fails against the group key. Try to link the two. You can't.",
    learn: "Why threshold spends can blend into the shielded pool.",
  },
] as const;

export function Levels() {
  return (
    <section id="levels" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHead
            eyebrow="Four levels"
            title={
              <>
                Each level is one idea <em className="text-glacier">you can break.</em>
              </>
            }
          />
          <Reveal className="max-w-sm text-moss">
            Every level runs real protocol code on every phone. No real funds: what gets signed is a
            demo message, and the screen says so.
          </Reveal>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2">
          {levels.map((l, i) => (
            <Reveal key={l.n} delay={(i % 2) * 120}>
              <article className="panel tilt group h-full p-8">
                <div className="lift">
                  <div className="flex items-start justify-between">
                    <span className="display text-[4.5rem] leading-none text-glacier/15 transition-colors duration-500 group-hover:text-glacier/40">
                      0{l.n}
                    </span>
                    <span
                      className={[
                        "chip",
                        l.status === "Stretch" ? "!border-brass/30 !text-brass" : "!text-glacier",
                      ].join(" ")}
                    >
                      {l.status === "Core" ? "Core · MVP" : "Stretch goal"}
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold tracking-tight">{l.name}</h3>
                  <p className="mt-3 leading-relaxed text-moss">{l.play}</p>
                  <p className="mt-6 flex items-start gap-3 border-t border-glacier/10 pt-5 text-sm text-bone">
                    <span className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-glacier">
                      Lesson
                    </span>
                    {l.learn}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Architecture                                                     */
/* ------------------------------------------------------------------ */

const flow = [
  ["Join", "Scan a QR code to join a room. Each phone gets a participant ID."],
  ["DKG round 1", "Every phone broadcasts public commitments."],
  ["DKG round 2", "Secret packages are encrypted to each recipient, then relayed."],
  ["Finish", "Each phone derives its own share and the shared group key locally."],
  ["Sign", "Commitments, signing package, signature shares, aggregate, verify."],
] as const;

const stack = [
  ["frost-core", "3.x", "Zcash Foundation FROST, with cheater detection"],
  ["reddsa", "frost feature", "RedPallas ciphersuite (re-randomized)"],
  ["wasm-bindgen", "wasm-pack", "Rust → WebAssembly for the browser"],
  ["Next.js", "16", "Static UI, works offline once loaded"],
  ["Relay", "WebSocket", "~100 lines, forwards messages only"],
] as const;

export function Architecture() {
  return (
    <section id="architecture" className="relative border-t border-glacier/10 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Architecture"
          title={
            <>
              The cryptography runs <em className="text-glacier">on your phone.</em>
            </>
          }
          lede="Every player's browser runs the Zcash Foundation's Rust FROST crates compiled to WebAssembly. The server is a dumb relay. It moves messages between phones and never holds a share."
        />

        <Reveal className="mt-16">
          <div className="panel overflow-hidden p-6 sm:p-10">
            <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_auto_0.8fr_auto_1fr]">
              <PhoneBox label="Phone · Asha" />
              <Wire />
              <div className="flex flex-col justify-center rounded-2xl border border-dashed border-ember/30 bg-ember/[0.04] p-6 text-center">
                <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ember">untrusted</p>
                <p className="mt-2 text-lg font-semibold">Relay</p>
                <p className="mt-1 text-sm text-moss">WebSocket room. Forwards public commitments and ciphertext.</p>
              </div>
              <Wire />
              <PhoneBox label="Phone · Kabir … Zoya" />
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="panel h-full p-7">
              <p className="eyebrow">Data flow</p>
              <ol className="mt-5 space-y-4">
                {flow.map(([step, text], i) => (
                  <li key={step} className="flex gap-4">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-glacier/25 font-mono text-xs text-glacier">
                      {i + 1}
                    </span>
                    <p className="text-moss">
                      <span className="font-semibold text-bone">{step}.</span> {text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="panel h-full p-7">
              <p className="eyebrow">Stack</p>
              <dl className="mt-5 divide-y divide-glacier/10">
                {stack.map(([name, ver, role]) => (
                  <div key={name} className="grid grid-cols-[8.5rem_1fr] gap-4 py-3 first:pt-0">
                    <dt>
                      <span className="font-mono text-sm text-bone">{name}</span>
                      <span className="block font-mono text-[0.65rem] text-moss-deep">{ver}</span>
                    </dt>
                    <dd className="text-sm text-moss">{role}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PhoneBox({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-glacier/15 bg-ink p-5">
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-moss">{label}</p>
      <div className="mt-4 space-y-2">
        <Layer title="Game UI" sub="React · Next.js" />
        <Layer title="frost-wasm" sub="frost-core 3 · reddsa RedPallas" accent />
        <Layer title="Secret share" sub="in memory only · never sent" brass />
      </div>
    </div>
  );
}

function Layer({ title, sub, accent, brass }: { title: string; sub: string; accent?: boolean; brass?: boolean }) {
  return (
    <div
      className={[
        "rounded-xl border px-4 py-3",
        accent ? "border-glacier/40 bg-glacier/[0.07]" : brass ? "border-brass/35 bg-brass/[0.06]" : "border-bone/10",
      ].join(" ")}
    >
      <p className={`text-sm font-semibold ${brass ? "text-brass" : accent ? "text-glacier" : "text-bone"}`}>{title}</p>
      <p className="font-mono text-[0.68rem] text-moss">{sub}</p>
    </div>
  );
}

function Wire() {
  return (
    <div className="flex items-center justify-center py-2 lg:py-0" aria-hidden="true">
      <div className="flex items-center gap-1.5 font-mono text-xs text-glacier/60 lg:flex-col">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-glacier/60 lg:h-10 lg:w-px lg:bg-gradient-to-b" />
        ⇄
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-glacier/60 lg:h-10 lg:w-px lg:bg-gradient-to-t" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Threat model (the one light section)                             */
/* ------------------------------------------------------------------ */

const trust = [
  {
    title: "Unaudited. Demo only.",
    body: "The upstream FROST crates have had independent audits. This app has not. Never use a Hima key for anything real.",
  },
  {
    title: "No funds, ever.",
    body: "The game signs demo messages, not transactions. No ZEC, no seed phrase, no wallet connection.",
  },
  {
    title: "The relay is untrusted.",
    body: "Secret DKG round-2 packages are encrypted to their recipient before leaving the phone. The relay sees only public commitments and ciphertext.",
  },
  {
    title: "Shares live in memory.",
    body: "Close the tab and your share is gone. That's right for a classroom, and a limitation we say out loud.",
  },
  {
    title: "Re-randomized FROST is a draft.",
    body: "ZIP 312 is still a draft. Hima teaches the idea. It is not a reference implementation.",
  },
  {
    title: "Labels never lie.",
    body: "Anything simulated, like the planted cheater or the demo message, is marked as simulated on screen.",
  },
] as const;

export function Trust() {
  return (
    <section id="trust" className="relative bg-bone py-28 text-ink sm:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          dark={false}
          eyebrow="Threat model"
          title={
            <>
              A privacy project should be <em className="text-ember-deep">honest about its limits.</em>
            </>
          }
          lede="Here is exactly what Hima does and doesn't protect. This describes the MVP design; the README tracks what has shipped."
        />
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
          {trust.map((t, i) => (
            <Reveal key={t.title} delay={(i % 3) * 100} className="bg-bone p-8 transition-colors hover:bg-bone-2">
              <span className="font-mono text-xs text-ember-deep">0{i + 1}</span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{t.title}</h3>
              <p className="mt-2 leading-relaxed text-ink/65">{t.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Roadmap                                                          */
/* ------------------------------------------------------------------ */

const roadmap = [
  {
    when: "Nov 2026",
    title: "Hackathon MVP",
    body: "Levels 1, 2 and 4. Hot-seat mode on one screen plus room mode across phones. Open source under MIT.",
    now: true,
  },
  {
    when: "Early 2027",
    title: "Live on campus",
    body: "Run sessions through the Zcash India Community Club. One test: can a first-year explain a threshold signature after 15 minutes?",
  },
  {
    when: "2027",
    title: "FROST Ceremony Kit",
    body: "Hima's WASM core and ceremony UI, packaged for FROST wallet teams: key ceremonies, signer messaging, recovery flows.",
  },
  {
    when: "Next",
    title: "“What am I co-signing?”",
    body: "A plain-language check of the transaction (PCZT) before a signer contributes their share. Clear signing for threshold wallets.",
  },
] as const;

export function Roadmap() {
  return (
    <section id="roadmap" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Roadmap"
          title={
            <>
              From a game in a classroom <em className="text-glacier">to infrastructure.</em>
            </>
          }
          lede="Every FROST wallet needs people to run a key ceremony and sign safely. Hima is where that UX gets tested on real people first."
        />
        <div className="relative mt-16">
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-[1.15rem] hidden h-px bg-gradient-to-r from-glacier/60 via-glacier/20 to-transparent md:block"
        />
        <ol className="relative grid gap-5 md:grid-cols-4">
          {roadmap.map((r, i) => (
            <Reveal as="li" key={r.title} delay={i * 110} className="relative">
              <span
                className={[
                  "relative z-10 grid size-9 place-items-center rounded-full border font-mono text-xs",
                  "now" in r && r.now
                    ? "border-glacier bg-glacier text-ink shadow-[0_0_30px_-4px_#9fe7d4]"
                    : "border-glacier/25 bg-ink text-glacier",
                ].join(" ")}
              >
                {i + 1}
              </span>
              <p className="mt-6 font-mono text-xs uppercase tracking-widest text-moss-deep">{r.when}</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{r.title}</h3>
              <p className="mt-2 leading-relaxed text-moss">{r.body}</p>
            </Reveal>
          ))}
        </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Closing CTA + footer                                             */
/* ------------------------------------------------------------------ */

export function Closing() {
  return (
    <section className="relative px-6 pb-24">
      <Reveal className="mx-auto max-w-7xl">
        <div className="panel relative overflow-hidden px-8 py-16 text-center sm:px-16 sm:py-24">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-72 w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-glacier/20 blur-[100px]"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-60 w-60 translate-x-1/3 translate-y-1/3 rounded-full bg-ember/15 blur-[90px]"
          />
          <p className="eyebrow relative">Bring it to your campus</p>
          <h2 className="display relative mx-auto mt-5 max-w-3xl text-[clamp(2.4rem,5.5vw,4.6rem)]">
            Five phones. Fifteen minutes. <em className="text-gradient">One shared secret.</em>
          </h2>
          <p className="relative mx-auto mt-6 max-w-xl text-lg text-moss">
            Built in the open for the Zcash India community. Star the repo, run it at your next meetup,
            or break it and tell us how.
          </p>
          <div className="relative mt-10 flex flex-wrap justify-center gap-3">
            <a href={site.repoUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              <GitHubIcon /> Star on GitHub
            </a>
            <a href={site.authorUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <XIcon /> Follow the build <ArrowIcon />
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-glacier/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-md text-sm text-moss">
            Open source under the {site.license} license. Unaudited, for education only. An independent
            community project, not affiliated with the Zcash Foundation or Electric Coin Company.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-moss md:items-end">
          <a href={site.repoUrl} target="_blank" rel="noreferrer" className="hover:text-bone">
            GitHub
          </a>
          <a href={site.authorUrl} target="_blank" rel="noreferrer" className="hover:text-bone">
            Built by @{site.author}
          </a>
          <span className="font-mono text-xs text-moss-deep">Zcash India · Build on Zcash 2026</span>
        </div>
      </div>
    </footer>
  );
}
