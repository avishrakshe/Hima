/**
 * The story layer: the agents and kid-level words mapped onto real protocol
 * steps. Comments in each level say which FROST concept each metaphor stands for.
 */

import { agentById, art, type Agent } from "@/lib/agents";

export type Friend = { name: string; agent: Agent["id"]; color: string; face: string; img: string };

const PLAYABLE: Agent["id"][] = ["hima", "warden", "orchard", "veil", "sapling"];

export const FRIENDS: Friend[] = PLAYABLE.map((id) => {
  const a = agentById(id);
  return { name: a.name, agent: id, color: a.color, face: a.face, img: art(id, "sm") };
});

/** Player index (1-based) to their agent card. */
export const friendOf = (index: number, name?: string): Friend => {
  const f = FRIENDS[(index - 1) % FRIENDS.length];
  return name ? { ...f, name } : f;
};

/** The thing the team signs. A demo message, never a transaction. */
export const LETTER = "Open the treasure chest!";

export type LevelId = "key" | "trickster" | "disguise";

export const LEVELS: {
  id: LevelId | "old";
  n: number;
  title: string;
  blurb: string;
  agent: Agent["id"];
  badge: string;
  /** What it really is, shown in grown-up mode. */
  tech: string;
}[] = [
  { id: "key", n: 1, title: "The Magic Key", blurb: "Forge a key that nobody holds", agent: "hima", badge: "Key Maker", tech: "Distributed key generation (DKG)" },
  { id: "trickster", n: 2, title: "Catch the Trickster", blurb: "Vex corrupted an agent. Who?", agent: "vex", badge: "Trickster Catcher", tech: "Threshold signing + cheater detection" },
  { id: "old", n: 3, title: "Old Snowflakes", blurb: "Coming soon", agent: "warden", badge: "", tech: "Share refresh (stretch goal)" },
  { id: "disguise", n: 4, title: "Disguise Party", blurb: "Hide from the spies", agent: "veil", badge: "Master of Disguise", tech: "Re-randomized FROST (unlinkability)" },
];
