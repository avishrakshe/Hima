"use client";

import Image from "next/image";
import { useState } from "react";
import { AGENTS, art, type Agent } from "@/lib/agents";
import { sfx } from "../game/fx";

export function AgentShowcase() {
  const [active, setActive] = useState<Agent>(AGENTS[0]);
  const villain = active.id === "vex";

  const pick = (a: Agent) => {
    if (a.id === active.id) return;
    sfx("tap");
    setActive(a);
  };

  return (
    <section id="agents" className="relative overflow-hidden bg-night py-20 lg:py-0">
      {/* Agent-tinted atmosphere */}
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-[background] duration-700"
        style={{ background: `radial-gradient(ellipse 55% 70% at 55% 55%, ${active.color}30, transparent 70%)` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.025)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.025)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="relative mx-auto grid max-w-[1400px] gap-8 px-5 sm:px-8 lg:min-h-[100svh] lg:grid-cols-[250px_1fr_380px] lg:items-center">
        {/* Roster list */}
        <div className="lg:py-24">
          <p className="tick font-mono text-xs uppercase tracking-[0.3em] text-gold">Choose your agent</p>
          <h2 className="font-display mt-3 text-6xl text-cream lg:text-7xl">Agents</h2>
          <ul className="mt-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] lg:flex-col lg:overflow-visible">
            {AGENTS.map((a) => {
              const on = a.id === active.id;
              return (
                <li key={a.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => pick(a)}
                    aria-pressed={on}
                    className={`group flex w-full items-center gap-3 border-l-2 py-2 pl-3 pr-4 text-left transition-all ${on ? "border-gold bg-white/[0.06]" : "border-transparent hover:bg-white/[0.03]"}`}
                  >
                    <span
                      className="size-11 shrink-0 bg-night-2 bg-no-repeat transition-transform group-hover:scale-105 cut-sm"
                      style={{ backgroundImage: `url(${art(a.id, "sm")})`, backgroundSize: "300%", backgroundPosition: a.face }}
                    />
                    <span>
                      <span className={`font-display block text-xl ${on ? "text-cream" : "text-cream/60"}`}>{a.name}</span>
                      <span className="block font-mono text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: a.id === "vex" ? "#ff7a45" : "rgb(236 230 218 / 0.45)" }}>
                        {a.role}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Character */}
        <div className="relative h-[62vh] min-h-[420px] lg:h-[100svh]">
          <p
            key={`name-${active.id}`}
            aria-hidden="true"
            className="font-display outline-text slide-in-right pointer-events-none absolute inset-x-0 top-[12%] select-none text-center text-[clamp(6rem,15vw,13rem)] leading-none"
            style={{ color: `${active.color}55` }}
          >
            {active.name}
          </p>
          <div aria-hidden="true" className="glow-pulse absolute inset-[22%_18%_10%] rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${active.color}55, transparent 65%)` }} />
          <div aria-hidden="true" className="absolute inset-[8%_4%_0] bg-[radial-gradient(ellipse_at_center,#0b0f14_42%,transparent_70%)]" />
          <div key={active.id} className="reveal-up absolute inset-0 mix-blend-lighten [mask-image:radial-gradient(ellipse_56%_60%_at_50%_50%,black_60%,transparent_80%)]">
            <Image src={art(active.id)} alt={`${active.name}, ${active.title}`} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-contain object-bottom" />
          </div>
        </div>

        {/* Dossier */}
        <div key={`info-${active.id}`} className="slide-in-right relative lg:py-24">
          <div className="flex items-end gap-4">
            <span className={`font-display text-8xl italic leading-none ${villain ? "text-ember" : "text-gold"} drop-shadow-[0_0_24px_rgba(244,183,40,0.45)]`}>
              {active.rank}
            </span>
            <span className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-cream/60">{villain ? "Threat level" : "Rank"}</span>
          </div>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.25em]" style={{ color: active.color }}>
            {active.title} · {active.role}
          </p>
          <h3 className="font-display mt-2 text-6xl text-cream">{active.name}</h3>
          <p className="mt-4 leading-relaxed text-cream/70">{active.lore}</p>

          <div className="cut mt-6 bg-white/[0.05] p-5">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-gold">Signature ability</p>
            <p className="mt-2 text-cream">{active.ability}</p>
            <p className="mt-3 border-t border-white/10 pt-3 font-mono text-[0.7rem] leading-relaxed text-cream/50">
              <span className="text-cream/70">In real life:</span> {active.tech}
            </p>
          </div>

          <dl className="mt-6 space-y-3">
            {active.stats.map((s, i) => (
              <div key={s.label}>
                <div className="flex justify-between font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cream/60">
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
                <div className="mt-1.5 h-1.5 bg-white/10">
                  <div className="bar-fill h-full" style={{ width: `${s.value}%`, background: active.color, animationDelay: `${0.2 + i * 0.12}s` }} />
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
