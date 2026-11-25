"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { GitHubIcon } from "../icons";

const LINKS = [
  { href: "#agents", label: "Agents" },
  { href: "#missions", label: "Missions" },
  { href: "#how", label: "How it works" },
  { href: "#proof", label: "Live proof" },
  { href: "#honest", label: "Honest" },
];

export function PosterNav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${solid ? "border-b border-white/10 bg-night/90 backdrop-blur-md" : "bg-gradient-to-b from-night/80 to-transparent"}`}
    >
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center gap-8 px-5 sm:px-8" aria-label="Main">
        <a href="#top" className="flex items-baseline gap-2" aria-label="Hima home">
          <span className="font-display text-3xl text-cream">Hima</span>
          <span className="font-mono text-[0.6rem] tracking-[0.3em] text-gold">FROST</span>
        </a>
        <ul className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="font-display text-[0.95rem] tracking-[0.08em] text-cream/70 transition-colors hover:text-gold">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-3">
          <a href={site.repoUrl} target="_blank" rel="noreferrer" aria-label="Source on GitHub" className="grid size-10 place-items-center text-cream/70 hover:text-gold">
            <GitHubIcon className="size-5" />
          </a>
          <Link href="/play" className="btn-poster !h-10 !px-5 !text-base">
            Play free
          </Link>
        </div>
      </nav>
    </header>
  );
}
