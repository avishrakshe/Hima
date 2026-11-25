/**
 * Single source of truth for links and copy that change over time.
 * Update `repoUrl` once the GitHub repository is public.
 */
export const site = {
  name: "Hima",
  tagline: "Learn Zcash FROST threshold signatures by playing them.",
  description:
    "Hima (Sanskrit for frost) is a multiplayer browser game where 3–5 people generate a shared Zcash key and co-sign together, running the Zcash Foundation's real FROST v3 code compiled to WebAssembly. No ZEC, no seed phrases.",
  repoUrl: "https://github.com/avishrakshe/Hima",
  author: "jarvisAP",
  authorUrl: "https://x.com/jarvisAP",
  status: "Hot-seat MVP playable · Zcash India “Build on Zcash” 2026",
  license: "MIT",
} as const;

export const navLinks = [
  { href: "#idea", label: "The idea" },
  { href: "#try", label: "Try the rule" },
  { href: "#levels", label: "Levels" },
  { href: "#architecture", label: "Architecture" },
  { href: "#trust", label: "Threat model" },
  { href: "#roadmap", label: "Roadmap" },
] as const;
