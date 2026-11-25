import Link from "next/link";
import { site } from "@/lib/site";
import HeroVisual from "../hero/HeroVisual";
import { ArrowIcon, GitHubIcon } from "../icons";

const stats = [
  { value: "3–5", label: "players, one phone each" },
  { value: "0 ZEC", label: "no funds, no seed phrases" },
  { value: "FROST v3", label: "Zcash Foundation code in WASM" },
] as const;

const stack = [
  "frost-core 3.0",
  "reddsa · RedPallas",
  "re-randomized FROST",
  "ZIP 312",
  "distributed key generation",
  "cheater detection",
  "share refresh",
  "wasm-bindgen",
  "Zcash NU7",
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-16">
      {/* Background atmosphere */}
      <div aria-hidden="true" className="grid-lines absolute inset-0" />
      <div
        aria-hidden="true"
        className="absolute -left-40 top-24 size-[520px] rounded-full bg-glacier-deep/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 right-0 size-[480px] rounded-full bg-ember/[0.07] blur-[120px]"
      />

      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-4 px-6 lg:grid-cols-[1.02fr_1fr]">
        <div className="relative z-10 pt-12 lg:pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">
              <span className="pulse-dot size-1.5 rounded-full bg-glacier" />
              {site.status}
            </span>
            <span className="chip" title="Hima: Sanskrit for frost or snow">
              <span className="text-glacier">हिम</span> hima · Sanskrit for frost
            </span>
          </div>

          <h1 className="display mt-7 text-[clamp(3.1rem,7.4vw,6.6rem)]">
            Split the key.
            <br />
            <em className="text-glacier">Sign together.</em>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-moss sm:text-xl">
            Hima is a multiplayer browser game that teaches Zcash&apos;s threshold
            signatures by having you <span className="text-bone">do them</span>. Gather friends around
            one screen, generate one shared key, co-sign with it, unmask a cheater, and watch a
            signature become unlinkable.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/play" className="btn btn-primary">
              Play now · hot-seat <ArrowIcon />
            </Link>
            <a href="#idea" className="btn btn-ghost">
              See how it works
            </a>
            <a
              href={site.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-2 text-sm text-moss transition-colors hover:text-bone"
            >
              <GitHubIcon /> Source
            </a>
          </div>

          <dl className="mt-12 grid max-w-xl grid-cols-3 divide-x divide-glacier/10 border-t border-glacier/10 pt-6">
            {stats.map((s) => (
              <div key={s.value} className="px-4 first:pl-0">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-semibold tracking-tight text-bone sm:text-[1.7rem]">
                  {s.value}
                </dd>
                <dd className="mt-1 text-xs leading-snug text-moss sm:text-sm">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative h-[480px] sm:h-[580px] lg:-mr-20 lg:h-[760px]">
          <HeroVisual />
        </div>
      </div>

      {/* Tech marquee */}
      <div className="relative border-y border-glacier/10 bg-ink-2/60 py-4">
        <div className="flex w-max marquee gap-10 whitespace-nowrap font-mono text-xs uppercase tracking-[0.2em] text-moss-deep">
          {[...stack, ...stack].map((item, i) => (
            <span key={i} className="flex items-center gap-10">
              {item}
              <span className="text-glacier/40">◆</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
