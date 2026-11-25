"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Snowfall } from "./Snowfall";

/** Full-bleed key art: citadel backdrop, Hima in front, snow, gentle mouse parallax. */
export function PosterHero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--px", x.toFixed(3));
        el.style.setProperty("--py", y.toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section id="top" ref={root} className="relative min-h-[100svh] overflow-hidden bg-night" style={{ ["--px" as string]: 0, ["--py" as string]: 0 }}>
      {/* Backdrop */}
      <div
        className="absolute -inset-8 transition-transform duration-700 ease-out"
        style={{ transform: "translate3d(calc(var(--px) * -24px), calc(var(--py) * -16px), 0)" }}
      >
        <Image src="/art/citadel.webp" alt="" fill priority sizes="100vw" className="kenburns object-cover object-[62%_center] opacity-75" />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-night via-night/80 to-night/10" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-night to-transparent" />
      <Snowfall />

      {/* Hero character */}
      <div
        className="pointer-events-none absolute bottom-0 right-[-6%] hidden h-[94%] w-[52%] mix-blend-lighten transition-transform duration-700 ease-out md:block lg:right-[1%] lg:w-[44%]"
        style={{ transform: "translate3d(calc(var(--px) * 18px), calc(var(--py) * 10px), 0)" }}
      >
        <div aria-hidden="true" className="glow-pulse absolute inset-[18%_12%_10%] rounded-full bg-[radial-gradient(circle,rgb(159_231_212/0.35),transparent_65%)] blur-2xl" />
        <div aria-hidden="true" className="absolute inset-[6%_8%_0] rounded-full bg-[radial-gradient(ellipse_at_center,#0b0f14_45%,transparent_72%)]" />
        <div className="float-y relative h-full w-full [mask-image:radial-gradient(ellipse_58%_62%_at_50%_48%,black_62%,transparent_82%)]">
          <Image src="/art/hima.webp" alt="Hima, the Frost Keeper" fill priority sizes="50vw" className="object-contain object-bottom" />
        </div>
      </div>

      {/* Copy */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-center px-5 pb-28 pt-24 sm:px-8">
        <p className="tick font-mono text-xs uppercase tracking-[0.3em] text-gold">Season 01 · Frost · Built on Zcash</p>
        <h1 className="font-display mt-5 text-[clamp(6rem,18vw,15rem)] text-cream drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]">Hima</h1>
        <p className="font-display mt-3 text-[clamp(1.7rem,3.4vw,3rem)] text-cream">
          Split the key. <span className="text-gold">Sign together.</span>
        </p>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-cream/75">
          A team game about Zcash&apos;s FROST magic. Forge a key nobody holds, catch the trickster, and vanish from the
          spies, with the <b className="text-cream">real</b> cryptography running in your browser.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href="/play" className="btn-poster">
            Play free <span aria-hidden="true">→</span>
          </Link>
          <a href="#agents" className="btn-poster-ghost">
            Meet the agents
          </a>
        </div>
      </div>

      {/* HUD strip */}
      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-night/70 backdrop-blur-sm">
        <dl className="mx-auto grid max-w-[1400px] grid-cols-3 divide-x divide-white/10 px-5 sm:px-8">
          {[
            ["Engine", "Real FROST v3 · WebAssembly"],
            ["Cost to play", "0 ZEC · no wallet"],
            ["License", "Open source · MIT"],
          ].map(([k, v]) => (
            <div key={k} className="px-3 py-4 first:pl-0 sm:px-6">
              <dt className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-gold">{k}</dt>
              <dd className="font-display mt-1 text-sm tracking-wide text-cream sm:text-lg">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p aria-hidden="true" className="font-display absolute right-4 top-1/2 hidden origin-right -translate-y-1/2 rotate-90 text-xs tracking-[0.5em] text-cream/30 xl:block">
        हिम · Sanskrit for frost
      </p>
    </section>
  );
}
