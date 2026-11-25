/**
 * The story layer: friendly characters and kid-level words mapped onto real
 * protocol steps. The comments say which FROST concept each metaphor stands for.
 */

export type Friend = { name: string; emoji: string; color: string };

export const FRIENDS: Friend[] = [
  { name: "Asha", emoji: "🦊", color: "#ff9a5c" },
  { name: "Kabir", emoji: "🐼", color: "#9fe7d4" },
  { name: "Meera", emoji: "🐯", color: "#e8b65a" },
  { name: "Rohan", emoji: "🐸", color: "#8fd694" },
  { name: "Zoya", emoji: "🐧", color: "#9ab8ff" },
];

/** Player index (1-based) to their friend card. */
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
  emoji: string;
  badge: string;
  /** What it really is, shown in grown-up mode. */
  tech: string;
}[] = [
  { id: "key", n: 1, title: "The Magic Key", blurb: "Make a key that nobody holds", emoji: "🔑", badge: "Key Maker", tech: "Distributed key generation (DKG)" },
  { id: "trickster", n: 2, title: "Catch the Trickster", blurb: "One friend is cheating. Who?", emoji: "🕵️", badge: "Trickster Catcher", tech: "Threshold signing + cheater detection" },
  { id: "old", n: 3, title: "Old Snowflakes", blurb: "Coming soon", emoji: "❄️", badge: "", tech: "Share refresh (stretch goal)" },
  { id: "disguise", n: 4, title: "Disguise Party", blurb: "Hide from the spies", emoji: "🎭", badge: "Master of Disguise", tech: "Re-randomized FROST (unlinkability)" },
];
