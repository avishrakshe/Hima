/**
 * The Hima roster. Every agent embodies one real FROST / Zcash concept;
 * `ability` is the kid-level version, `tech` the grown-up one.
 * Art: original characters generated for this project (web/public/art).
 */

export type Agent = {
  id: "hima" | "warden" | "relay" | "veil" | "orchard" | "sapling" | "vex";
  name: string;
  title: string;
  role: string;
  rank: string;
  color: string;
  /** Background-position that frames the face in a round portrait. */
  face: string;
  lore: string;
  ability: string;
  tech: string;
  stats: { label: string; value: number }[];
};

export const AGENTS: Agent[] = [
  {
    id: "hima",
    name: "Hima",
    title: "The Frost Keeper",
    role: "Keysmith",
    rank: "Z",
    color: "#9fe7d4",
    face: "50% 7%",
    lore: "Hima guards the Frost Citadel. She taught the agents the oldest rule of the vault: a key that one person holds can be stolen from one person.",
    ability: "Key Ceremony: forges one magic key out of everyone's secret snowflakes, so nobody ever holds the whole thing.",
    tech: "Distributed key generation (DKG): commitments, private shares, key shares. No dealer.",
    stats: [
      { label: "Privacy", value: 92 },
      { label: "Teamwork", value: 100 },
      { label: "Secrecy", value: 88 },
    ],
  },
  {
    id: "warden",
    name: "Warden",
    title: "The Shield Guardian",
    role: "Signer",
    rank: "Z",
    color: "#f4b728",
    face: "48% 6%",
    lore: "Warden never opens the vault alone. His golden shield only lights up when enough agents stand beside him.",
    ability: "Threshold Shield: any 3 of 5 agents can sign together. 2 can't, no matter how hard they try.",
    tech: "t-of-n threshold Schnorr signatures over RedPallas (FROST).",
    stats: [
      { label: "Defense", value: 98 },
      { label: "Trust", value: 90 },
      { label: "Speed", value: 54 },
    ],
  },
  {
    id: "relay",
    name: "Relay",
    title: "The Coordinator",
    role: "Coordinator",
    rank: "Z",
    color: "#e9e9e9",
    face: "56% 7%",
    lore: "Relay carries every message between agents and checks every puzzle piece. She can't sign anything herself, and she likes it that way.",
    ability: "Piece Checker: tests every signature piece and names anyone who cheated.",
    tech: "Signature-share verification and aggregation with FROST v3 cheater detection.",
    stats: [
      { label: "Speed", value: 96 },
      { label: "Accuracy", value: 100 },
      { label: "Power", value: 40 },
    ],
  },
  {
    id: "veil",
    name: "Veil",
    title: "Master of Disguise",
    role: "Phantom",
    rank: "Z",
    color: "#8b7bff",
    face: "50% 8%",
    lore: "Nobody has seen Veil's face twice. Every letter the team signs leaves the vault wearing one of Veil's disguises.",
    ability: "New Face: every signature wears a brand-new disguise, so spies can't tell who signed.",
    tech: "Re-randomized FROST: each signature verifies under group key + α·G (ZIP 312, draft).",
    stats: [
      { label: "Stealth", value: 100 },
      { label: "Privacy", value: 98 },
      { label: "Trust", value: 76 },
    ],
  },
  {
    id: "orchard",
    name: "Orchard",
    title: "The Archer",
    role: "Signer",
    rank: "Z",
    color: "#7fd07a",
    face: "43% 10%",
    lore: "Orchard's golden arrows always hit. When the team signs, the arrow looks exactly like one fired by a single archer.",
    ability: "True Shot: a team signature looks like any normal signature, so nobody can tell a team made it.",
    tech: "Aggregated FROST signatures are plain RedPallas signatures, like Orchard spend authorizations.",
    stats: [
      { label: "Precision", value: 97 },
      { label: "Stealth", value: 80 },
      { label: "Teamwork", value: 85 },
    ],
  },
  {
    id: "sapling",
    name: "Sapling",
    title: "The Tinkerer",
    role: "Builder",
    rank: "Z",
    color: "#a8f0d0",
    face: "50% 11%",
    lore: "Sapling squeezed the whole vault engine into a tiny machine that fits in any browser. Her robot, Bolt, helps.",
    ability: "Pocket Forge: runs the real magic engine right on your device. Nothing leaves your screen.",
    tech: "Zcash Foundation frost-core 3 + reddsa compiled to WebAssembly (500 KB).",
    stats: [
      { label: "Craft", value: 99 },
      { label: "Speed", value: 88 },
      { label: "Chaos", value: 62 },
    ],
  },
  {
    id: "vex",
    name: "Vex",
    title: "The Trickster",
    role: "Adversary",
    rank: "?",
    color: "#ff7a45",
    face: "53% 6%",
    lore: "Vex sneaks into teams and makes one agent sign a letter nobody agreed to. Somehow, Vex always gets caught.",
    ability: "Forgery: signs the wrong letter and hopes nobody notices. (Spoiler: Relay notices.)",
    tech: "An invalid signature share, identified and attributed by cheater detection.",
    stats: [
      { label: "Mischief", value: 100 },
      { label: "Stealth", value: 70 },
      { label: "Success", value: 0 },
    ],
  },
];

export const agentById = (id: Agent["id"]) => AGENTS.find((a) => a.id === id)!;
export const art = (id: Agent["id"], size: "full" | "sm" = "full") => `/art/${id}${size === "sm" ? "-sm" : ""}.webp`;
