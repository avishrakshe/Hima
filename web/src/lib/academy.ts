/**
 * Zcash Academy: progress (saved in localStorage), codex facts and boss quiz.
 * Facts here are deliberately conservative, well-established Zcash basics.
 */
import { useSyncExternalStore } from "react";
import type { Agent } from "./agents";

export type ProgressKey = "spy" | "zk" | "glass" | "boss" | "frost";
export type Progress = Record<ProgressKey, boolean>;

const KEY = "hima-academy-v1";
const EMPTY: Progress = { spy: false, zk: false, glass: false, boss: false, frost: false };
let cache: Progress | null = null;
const listeners = new Set<() => void>();

function read(): Progress {
  if (cache) return cache;
  try {
    cache = { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    cache = { ...EMPTY };
  }
  return cache!;
}

function write(next: Progress) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private mode etc. Progress just won't persist.
  }
  listeners.forEach((l) => l());
}

export const completeLesson = (k: ProgressKey) => {
  if (!read()[k]) write({ ...read(), [k]: true });
};
export const resetProgress = () => write({ ...EMPTY });

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useProgress = () => useSyncExternalStore(subscribe, read, () => EMPTY);

/* ---------------- Codex: collectible fact cards ---------------- */

export type CodexCard = { id: string; title: string; fact: string; agent: Agent["id"]; unlock: ProgressKey };

export const CODEX: CodexCard[] = [
  { id: "two-doors", title: "Two kinds of address", agent: "orchard", unlock: "spy", fact: "Transparent addresses (t1…) are public, like Bitcoin. Shielded and unified addresses (u1…) keep the sender, receiver, amount and memo encrypted." },
  { id: "pools", title: "The shielded pools", agent: "sapling", unlock: "spy", fact: "Private ZEC lives in shielded pools: Sapling (2018) and Orchard (2022). The more people use them, the bigger the crowd you hide in." },
  { id: "supply", title: "21 million", agent: "warden", unlock: "spy", fact: "There will only ever be 21 million ZEC, the same cap as Bitcoin." },
  { id: "zk", title: "Zero-knowledge", agent: "hima", unlock: "zk", fact: "A zero-knowledge proof convinces you something is true without showing you the secret. Zcash proves a payment is valid without revealing who, to whom, or how much." },
  { id: "born", title: "Born in 2016", agent: "relay", unlock: "zk", fact: "Zcash launched in October 2016, the first major cryptocurrency built on zero-knowledge proofs (zk-SNARKs)." },
  { id: "halo", title: "No trusted setup", agent: "veil", unlock: "zk", fact: "Orchard uses Halo 2 proofs, which need no trusted setup ceremony." },
  { id: "viewing", title: "Viewing keys", agent: "warden", unlock: "glass", fact: "A viewing key lets someone see your shielded payments, for an accountant or auditor, without being able to spend a single coin." },
  { id: "memo", title: "Encrypted memos", agent: "sapling", unlock: "glass", fact: "Shielded payments can carry an encrypted memo of up to 512 bytes that only the receiver (or a viewing key holder) can read." },
  { id: "frost", title: "Many hands, one key", agent: "hima", unlock: "frost", fact: "FROST splits spending power across a team: any t of n can sign together, and the signature looks like anyone else's." },
];

/* ---------------- Boss battle quiz ---------------- */

export type Question = { q: string; options: string[]; answer: number; why: string };

export const QUIZ: Question[] = [
  {
    q: "Orchard sends ZEC from a shielded address to Sapling's shielded address. What can Vex see on the blockchain?",
    options: ["Who sent it", "How much was sent", "Only that a transaction happened, and its fee", "The memo"],
    answer: 2,
    why: "Fully shielded payments hide sender, receiver, amount and memo. The fee is still public.",
  },
  {
    q: "Which kind of address is public, like Bitcoin?",
    options: ["u1… unified", "t1… transparent", "Both are private"],
    answer: 1,
    why: "Transparent t-addresses show everything on-chain. Use shielded (u1…) for privacy.",
  },
  {
    q: "In the colour trick, a faker survives 10 rounds in a row. How lucky did they get?",
    options: ["About 1 in 2", "About 1 in 10", "About 1 in 1,000"],
    answer: 2,
    why: "Each round a faker guesses with a 1-in-2 chance: (1/2)^10 = 1 in 1,024.",
  },
  {
    q: "Sapling gives Warden a viewing key. What can Warden do?",
    options: ["Spend her ZEC", "See her payments and memos, but not spend", "Nothing at all"],
    answer: 1,
    why: "Viewing keys are look-only. Spending needs the spending key.",
  },
  {
    q: "What does a zero-knowledge proof let you do?",
    options: ["Make coins out of nothing", "Hide a coin forever", "Prove something is true without revealing the secret"],
    answer: 2,
    why: "Zcash proves a payment is valid without revealing the private details.",
  },
  {
    q: "A team uses 3-of-5 FROST. How many agents must sign?",
    options: ["Any 3 of them", "All 5", "Just 1"],
    answer: 0,
    why: "Any threshold-sized group can sign, and fewer can't.",
  },
  {
    q: "What's the most ZEC that will ever exist?",
    options: ["No limit", "21 million", "1 billion"],
    answer: 1,
    why: "Zcash has a fixed 21 million cap, like Bitcoin.",
  },
];
