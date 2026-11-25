/**
 * Game engine: the protocol steps of each level, as small pure functions over
 * frost-wasm. React components call these and render the results; nothing
 * here is mocked. Everything runs the real re-randomized FROST(Pallas).
 *
 * Hot-seat mode: all players share one tab, so every player's secrets live in
 * this tab's memory. In room mode each phone would hold only its own.
 */
import {
  frost,
  type AggregateOutcome,
  type Commitment,
  type DkgResult,
  type DkgRound1,
  type DkgRound2,
  type Hex,
  type IndexMap,
  type SigningRound,
} from "@/lib/frost";

export const DEFAULT_NAMES = ["Asha", "Kabir", "Meera", "Rohan", "Zoya"] as const;

export type Player = { index: number; name: string };

export type Ceremony = {
  n: number;
  t: number;
  players: Player[];
  round1: Record<number, DkgRound1>;
  round2: Record<number, DkgRound2>;
  result: Record<number, DkgResult>;
};

export const newCeremony = (players: Player[], t: number): Ceremony => ({
  n: players.length,
  t,
  players,
  round1: {},
  round2: {},
  result: {},
});

export const bytes = (hex: Hex) => hex.length / 2;
export const short = (hex: Hex, head = 8, tail = 6) =>
  hex.length <= head + tail ? hex : `${hex.slice(0, head)}…${hex.slice(-tail)}`;
export const nameOf = (c: Ceremony, index: number) =>
  c.players.find((p) => p.index === index)?.name ?? `#${index}`;

/* ---------------- Level 1: distributed key generation ---------------- */

/** Round-1 packages of everyone except `me`, as each player would receive them. */
export function othersRound1(c: Ceremony, me: number): IndexMap {
  const out: IndexMap = {};
  for (const p of c.players) if (p.index !== me) out[p.index] = c.round1[p.index].package;
  return out;
}

/** Round-2 packages addressed to `me` from every other player. */
export function inboxRound2(c: Ceremony, me: number): IndexMap {
  const out: IndexMap = {};
  for (const p of c.players) if (p.index !== me) out[p.index] = c.round2[p.index].packages[me];
  return out;
}

export const dkgCommit = (c: Ceremony, me: number): Ceremony => ({
  ...c,
  round1: { ...c.round1, [me]: frost.dkgPart1(me, c.n, c.t) },
});

export const dkgDeal = (c: Ceremony, me: number): Ceremony => ({
  ...c,
  round2: { ...c.round2, [me]: frost.dkgPart2(c.round1[me].secret, othersRound1(c, me)) },
});

export const dkgFinish = (c: Ceremony, me: number): Ceremony => ({
  ...c,
  result: {
    ...c.result,
    [me]: frost.dkgPart3(c.round2[me].secret, othersRound1(c, me), inboxRound2(c, me)),
  },
});

export const groupKey = (c: Ceremony): Hex | null => c.result[c.players[0].index]?.group_key ?? null;
export const publicKeyPackage = (c: Ceremony): Hex => c.result[c.players[0].index].public_key_package;
export const everyoneAgrees = (c: Ceremony) => {
  const keys = c.players.map((p) => c.result[p.index]?.group_key);
  return keys.every((k) => k && k === keys[0]);
};

/* ---------------- Signing (re-randomized FROST) ---------------- */

export type Attempt = {
  signers: number[];
  messageHex: Hex;
  /** Secret nonces are deleted from here the moment they are used. */
  commits: Record<number, Commitment>;
  round: SigningRound | null;
  shares: IndexMap;
  cheater: number | null;
  outcome: AggregateOutcome | null;
};

export const newAttempt = (signers: number[], messageHex: Hex, cheater: number | null = null): Attempt => ({
  signers: [...signers].sort((a, b) => a - b),
  messageHex,
  commits: {},
  round: null,
  shares: {},
  cheater,
  outcome: null,
});

/** Signing round 1 for one signer: fresh single-use nonces + public commitments. */
export const signCommit = (c: Ceremony, a: Attempt, me: number): Attempt => ({
  ...a,
  commits: { ...a.commits, [me]: frost.signCommit(c.result[me].key_package) },
});

/** Coordinator: fixes message + signer set, draws the randomizer. */
export function openRound(c: Ceremony, a: Attempt): Attempt {
  const commitments: IndexMap = {};
  for (const s of a.signers) commitments[s] = a.commits[s].commitments;
  return { ...a, round: frost.newSigningRound(commitments, a.messageHex, publicKeyPackage(c)) };
}

/** Signing round 2 for one signer. Burns that signer's nonces. */
export function signShare(c: Ceremony, a: Attempt, me: number): Attempt {
  if (!a.round) throw new Error("the coordinator has not opened the round yet");
  const { nonces, commitments } = a.commits[me];
  if (!nonces) throw new Error(`${nameOf(c, me)}'s nonces were already used. Nonces are single-use.`);
  const sign = me === a.cheater ? frost.signShareCheating : frost.signShare;
  const share = sign(a.round, nonces, c.result[me].key_package);
  return {
    ...a,
    commits: { ...a.commits, [me]: { nonces: "", commitments } },
    shares: { ...a.shares, [me]: share },
  };
}

export function aggregate(c: Ceremony, a: Attempt): Attempt {
  if (!a.round) throw new Error("no open round");
  return { ...a, outcome: frost.aggregate(a.round, a.shares, publicKeyPackage(c)) };
}

/** Runs a whole signing attempt in one go (used by "retry" and Level 4). */
export function signAll(c: Ceremony, signers: number[], messageHex: Hex, cheater: number | null = null): Attempt {
  let a = newAttempt(signers, messageHex, cheater);
  for (const s of a.signers) a = signCommit(c, a, s);
  a = openRound(c, a);
  for (const s of a.signers) a = signShare(c, a, s);
  return aggregate(c, a);
}

export const verify = (key: Hex, messageHex: Hex, signature: Hex) => frost.verify(key, messageHex, signature);
