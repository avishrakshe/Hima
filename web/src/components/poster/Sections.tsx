import Image from "next/image";
import Link from "next/link";
import { art, type Agent } from "@/lib/agents";
import { site } from "@/lib/site";
import HeroVisual from "../hero/HeroVisual";
import { LiveProof } from "../LiveProof";
import { Reveal } from "../ui";
import { GitHubIcon, XIcon } from "../icons";

function Kicker({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <p className={`tick font-mono text-xs uppercase tracking-[0.3em] ${dark ? "text-ink/70" : "text-gold"}`}>{children}</p>
  );
}

/* ---------------- Missions (cream, slanted) ---------------- */

const MISSIONS: { n: string; title: string; blurb: string; agent: Agent["id"]; tech: string; locked?: boolean }[] = [
  { n: "01", title: "The Magic Key", blurb: "Five agents forge one key that none of them holds alone.", agent: "hima", tech: "Distributed key generation" },
  { n: "02", title: "Catch the Trickster", blurb: "Vex corrupts one signer. Guess who, then watch Relay's checker bust them.", agent: "vex", tech: "Threshold signing + cheater detection" },
  { n: "03", title: "Old Snowflakes", blurb: "What happens to old key pieces after a refresh?", agent: "warden", tech: "Share refresh", locked: true },
  { n: "04", title: "Disguise Party", blurb: "Every letter wears a new disguise. Play the spy and try to unmask your own team.", agent: "veil", tech: "Re-randomized FROST" },
];

export function Missions() {
  return (
    <section id="missions" className="slant-top relative -mt-[6vw] bg-cream pb-24 pt-[calc(6vw+5rem)] text-ink">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Kicker dark>Story mode · 15 minutes</Kicker>
            <h2 className="font-display mt-3 text-7xl md:text-8xl">Missions</h2>
          </div>
          <p className="max-w-md text-lg text-ink/70">
            Each mission is one secret of Zcash&apos;s FROST, told as a story a 10-year-old can follow and a cryptographer
            can check.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {MISSIONS.map((m, i) => (
            <Reveal key={m.n} delay={i * 90}>
              <Link
                href={m.locked ? "#missions" : "/play"}
                aria-disabled={m.locked}
                className={`group cut block h-full bg-night text-cream transition-transform duration-500 ${m.locked ? "pointer-events-none opacity-60 grayscale" : "hover:-translate-y-2"}`}
              >
                <div className="relative h-72 overflow-hidden">
                  <Image
                    src={art(m.agent, "sm")}
                    alt=""
                    fill
                    sizes="(min-width:1280px) 25vw, 50vw"
                    className="object-cover object-[50%_18%] transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent" />
                  <span className="font-display absolute left-4 top-3 text-6xl text-gold/90">{m.n}</span>
                  {m.locked && (
                    <span className="font-display absolute right-4 top-4 bg-cream px-2 py-1 text-sm text-ink">Coming soon</span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-3xl">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/70">{m.blurb}</p>
                  <p className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cream/50">
                    {m.tech}
                    {!m.locked && <span className="text-gold transition-transform group-hover:translate-x-1">Play →</span>}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Zcash Academy teaser ---------------- */

const ACADEMY: { n: string; title: string; teaches: string; agent: Agent["id"]; line: string }[] = [
  { n: "01", title: "The Spy's View", teaches: "Transparent vs shielded", agent: "orchard", line: "Send ZEC four ways. See exactly what a spy can read." },
  { n: "02", title: "The Colour Trick", teaches: "Zero-knowledge proofs", agent: "hima", line: "Play a real zero-knowledge proof and unmask a faker." },
  { n: "03", title: "The Glass Key", teaches: "Viewing keys", agent: "warden", line: "Let someone check your money without letting them spend it." },
  { n: "04", title: "Defeat Vex", teaches: "Boss battle quiz", agent: "vex", line: "Every right answer is an attack. Three hearts." },
];

export function AcademyTeaser() {
  return (
    <section id="academy" className="relative overflow-hidden bg-night py-28">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_30%,rgb(244_183_40/0.12),transparent_70%)]" />
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Kicker>New · learn Zcash itself</Kicker>
            <h2 className="font-display mt-3 text-7xl text-cream md:text-8xl">
              Zcash <span className="text-gold">Academy</span>
            </h2>
          </div>
          <p className="max-w-md text-lg text-cream/70">
            Four playable lessons on how private money works: shielded payments, zero-knowledge proofs and viewing keys.
            Collect the Codex cards, then beat the boss.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {ACADEMY.map((a, i) => (
            <Reveal key={a.n} delay={i * 90}>
              <Link href="/learn" className="cut group relative block h-80 overflow-hidden bg-night-2">
                <Image src={art(a.agent, "sm")} alt="" fill sizes="(min-width:1280px) 25vw, 50vw" className="object-cover object-[50%_15%] opacity-80 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-night via-night/50 to-transparent" />
                <span className="font-display absolute left-4 top-3 text-5xl text-gold">{a.n}</span>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold">{a.teaches}</p>
                  <h3 className="font-display mt-1 text-3xl text-cream">{a.title}</h3>
                  <p className="mt-1 text-sm text-cream/70">{a.line}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link href="/learn" className="btn-poster">
            Enter the academy <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- How it works (live 3D vault) ---------------- */

const STEPS = [
  { n: "01", title: "Forge the key", body: "Every agent makes a secret snowflake and sends tiny secret pieces to the others. Together they get one key, and nobody ever holds all of it." },
  { n: "02", title: "Sign together", body: "Any 3 of 5 agents can sign a letter. Each one hands Relay a puzzle piece; she checks every piece and names any cheater." },
  { n: "03", title: "Vanish", body: "Each signature wears a fresh disguise, so spies can't link it to the team. On Zcash, that's how a group spend hides in the crowd." },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative overflow-hidden bg-night py-28">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <Kicker>How the magic works</Kicker>
          <h2 className="font-display mt-3 text-6xl text-cream md:text-7xl">
            Three moves. <span className="text-gold">Real crypto.</span>
          </h2>
          <ol className="mt-10 space-y-8">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 110} className="flex gap-5">
                <span className="font-display text-5xl text-gold">{s.n}</span>
                <div>
                  <h3 className="font-display text-2xl text-cream">{s.title}</h3>
                  <p className="mt-1 leading-relaxed text-cream/65">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
        <Reveal>
          <div className="cut relative h-[520px] bg-night-2">
            <p className="absolute left-5 top-4 z-10 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-gold">The vault · live 3D</p>
            <HeroVisual />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Live proof ---------------- */

export function Proof() {
  return (
    <section id="proof" className="relative bg-night pb-28">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
        <div className="mb-8 text-center">
          <Kicker>Not a mockup</Kicker>
          <h2 className="font-display mt-3 text-6xl text-cream md:text-7xl">Press the button.</h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/65">
            Sapling&apos;s Pocket Forge runs the Zcash Foundation&apos;s FROST v3 right here: a full 5-agent game, on your
            device, in under a second.
          </p>
        </div>
        <LiveProof />
      </div>
    </section>
  );
}

/* ---------------- Honest by design (cream) ---------------- */

const HONEST = [
  ["Unaudited", "The upstream FROST crates are audited. Hima itself is not. It's for learning."],
  ["No money, ever", "Agents sign demo letters, never transactions. No ZEC, no wallets, no seed phrases."],
  ["Vex is simulated", "The trickster role is pretend; the forged signature is real crypto and really gets caught."],
  ["One screen for now", "Hot-seat mode keeps every agent's secret in one tab. Fine for a classroom, not for a vault."],
  ["Draft standard", "Re-randomized FROST (ZIP 312) is still a draft. Hima teaches the idea."],
  ["Open source", "MIT licensed. Read every line, run it yourself, break it and tell us."],
];

const ROADMAP = [
  ["Now", "Hot-seat story mode"],
  ["Next", "Room mode: one phone per agent"],
  ["Then", "Live at Zcash India campus clubs"],
  ["Later", "Ceremony kit for FROST wallets"],
];

export function Honest() {
  return (
    <section id="honest" className="slant-both relative bg-cream py-[calc(4vw+5rem)] text-ink">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Kicker dark>Threat model</Kicker>
        <h2 className="font-display mt-3 text-7xl md:text-8xl">Honest by design</h2>
        <div className="mt-12 grid gap-px bg-ink/15 sm:grid-cols-2 lg:grid-cols-3">
          {HONEST.map(([t, b], i) => (
            <Reveal key={t} delay={(i % 3) * 90} className="bg-cream p-7">
              <span className="font-display text-3xl text-gold-deep">0{i + 1}</span>
              <h3 className="font-display mt-2 text-2xl">{t}</h3>
              <p className="mt-2 leading-relaxed text-ink/65">{b}</p>
            </Reveal>
          ))}
        </div>
        <ol className="mt-16 grid gap-4 md:grid-cols-4">
          {ROADMAP.map(([when, what], i) => (
            <li key={when} className={`cut-sm p-5 ${i === 0 ? "bg-ink text-cream" : "bg-ink/[0.06]"}`}>
              <p className={`font-mono text-[0.65rem] uppercase tracking-[0.25em] ${i === 0 ? "text-gold" : "text-ink/50"}`}>{when}</p>
              <p className="font-display mt-1 text-xl">{what}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- Final CTA + footer ---------------- */

export function FinalCta() {
  return (
    <section className="relative -mt-[4vw] overflow-hidden bg-gold pt-[4vw] text-ink">
      <div className="mx-auto grid max-w-[1400px] items-center gap-6 px-5 sm:px-8 md:grid-cols-[1fr_1.1fr]">
        <div className="py-16 md:py-24">
          <p className="tick font-mono text-xs uppercase tracking-[0.3em] text-ink/70 [&]:before:!bg-ink">Free · in your browser</p>
          <h2 className="font-display mt-3 text-7xl md:text-8xl">Assemble your team</h2>
          <p className="mt-4 max-w-md text-lg text-ink/75">Grab 3–5 friends and one screen. Fifteen minutes later, you&apos;ll understand FROST better than most of crypto Twitter.</p>
          <Link href="/play" className="btn-poster mt-8 !bg-ink !text-cream hover:!bg-night-2">
            Play free <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="cut relative mb-16 hidden h-[440px] overflow-hidden bg-night md:block">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_70%,rgb(244_183_40/0.35),transparent_65%)]" />
          {(["orchard", "warden", "sapling"] as const).map((id, i) => (
            <div
              key={id}
              className="absolute bottom-[-6%] h-[112%] w-[44%] mix-blend-lighten"
              style={{ left: `${i * 28}%`, zIndex: i === 1 ? 3 : 2, transform: i === 1 ? "scale(1.06)" : undefined, transformOrigin: "bottom" }}
            >
              <Image src={art(id, "sm")} alt="" fill sizes="25vw" className="object-cover object-top" />
            </div>
          ))}
          <p className="absolute bottom-4 left-5 z-10 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-gold">Orchard · Warden · Sapling</p>
        </div>
      </div>
    </section>
  );
}

export function PosterFooter() {
  return (
    <footer className="bg-night">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-baseline gap-2">
            <span className="font-display text-3xl text-cream">Hima</span>
            <span className="font-mono text-[0.6rem] tracking-[0.3em] text-gold">FROST</span>
          </p>
          <p className="mt-3 max-w-lg text-sm text-cream/50">
            MIT licensed · unaudited · for education. Original characters and art made for this project. An independent
            community project for Zcash India &ldquo;Build on Zcash&rdquo; 2026, not affiliated with the Zcash Foundation or
            Electric Coin Company.
          </p>
        </div>
        <div className="flex items-center gap-4 text-cream/60">
          <a href={site.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold">
            <GitHubIcon /> Source
          </a>
          <a href={site.authorUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold">
            <XIcon /> @{site.author}
          </a>
        </div>
      </div>
    </footer>
  );
}
