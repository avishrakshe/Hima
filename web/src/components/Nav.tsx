"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { navLinks, site } from "@/lib/site";
import { Wordmark } from "./Logo";
import { GitHubIcon } from "./icons";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "border-b border-glacier/10 bg-ink/75 backdrop-blur-xl" : "border-b border-transparent",
      ].join(" ")}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6" aria-label="Main">
        <a href="#top" aria-label={`${site.name} home`}>
          <Wordmark />
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-3.5 py-2 text-sm text-moss transition-colors hover:bg-bone/5 hover:text-bone"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={site.repoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Source on GitHub"
            className="grid size-10 place-items-center rounded-full text-moss transition-colors hover:bg-bone/5 hover:text-bone"
          >
            <GitHubIcon />
          </a>
          <Link href="/play" className="btn btn-primary !h-10 !px-5 text-sm">
            Play
          </Link>
        </div>
      </nav>
    </header>
  );
}
