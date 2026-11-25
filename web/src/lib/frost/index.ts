/**
 * Typed client for frost-wasm: the Zcash Foundation's re-randomized
 * FROST(Pallas, BLAKE2b-512), compiled to WebAssembly.
 *
 * Every protocol object is an opaque hex string. Participants are keyed by
 * index (1..=n). Secret values (`secret`, `nonces`, `key_package`) must stay in
 * this tab: never send them over the relay, and never reuse `nonces`.
 *
 * Unaudited, for education only.
 */
import init, * as wasm from "./pkg/frost_wasm";

export type Hex = string;
export type IndexMap = Record<number, Hex>;

export type DkgRound1 = { secret: Hex; package: Hex };
export type DkgRound2 = { secret: Hex; packages: IndexMap };
export type DkgResult = { key_package: Hex; public_key_package: Hex; group_key: Hex };
export type Commitment = { nonces: Hex; commitments: Hex };
export type SigningRound = { signing_package: Hex; randomizer_seed: Hex; randomized_key: Hex };
export type AggregateOutcome = {
  ok: boolean;
  signature: Hex | null;
  randomized_key: Hex | null;
  culprits: number[];
  error: string | null;
};
export type SelfTestReport = {
  participants: number;
  threshold: number;
  group_key: Hex;
  randomized_key_1: Hex;
  randomized_key_2: Hex;
  verifies_under_randomized_key: boolean;
  verifies_under_group_key: boolean;
  randomized_keys_differ: boolean;
  cheater: number;
  culprits_named: number[];
};

const WASM_URL = "/wasm/frost_wasm_bg.wasm";
let ready: Promise<void> | null = null;

/** Loads and instantiates the module once; safe to call repeatedly. */
export function loadFrost(): Promise<void> {
  ready ??= init({ module_or_path: WASM_URL }).then(() => undefined);
  return ready;
}

const json = <T>(s: string): T => JSON.parse(s) as T;
const str = (m: IndexMap) => JSON.stringify(m);

export const textToHex = (text: string) =>
  Array.from(new TextEncoder().encode(text), (b) => b.toString(16).padStart(2, "0")).join("");

/** All functions below require `await loadFrost()` first. */
export const frost = {
  version: () => wasm.version(),

  dkgPart1: (index: number, maxSigners: number, minSigners: number) =>
    json<DkgRound1>(wasm.dkgPart1(index, maxSigners, minSigners)),
  dkgPart2: (secret: Hex, round1FromOthers: IndexMap) =>
    json<DkgRound2>(wasm.dkgPart2(secret, str(round1FromOthers))),
  dkgPart3: (round2Secret: Hex, round1FromOthers: IndexMap, round2ToMe: IndexMap) =>
    json<DkgResult>(wasm.dkgPart3(round2Secret, str(round1FromOthers), str(round2ToMe))),

  signCommit: (keyPackage: Hex) => json<Commitment>(wasm.signCommit(keyPackage)),
  newSigningRound: (commitments: IndexMap, messageHex: Hex, publicKeyPackage: Hex) =>
    json<SigningRound>(wasm.newSigningRound(str(commitments), messageHex, publicKeyPackage)),
  signShare: (round: SigningRound, nonces: Hex, keyPackage: Hex) =>
    json<Hex>(wasm.signShare(round.signing_package, nonces, keyPackage, round.randomizer_seed)),
  /** Level 2 only: produces a share over a different message. Always label it as simulated. */
  signShareCheating: (round: SigningRound, nonces: Hex, keyPackage: Hex) =>
    json<Hex>(wasm.signShareCheating(round.signing_package, nonces, keyPackage, round.randomizer_seed)),
  aggregate: (round: SigningRound, shares: IndexMap, publicKeyPackage: Hex) =>
    json<AggregateOutcome>(
      wasm.aggregate(round.signing_package, str(shares), publicKeyPackage, round.randomizer_seed),
    ),
  verify: (verifyingKey: Hex, messageHex: Hex, signature: Hex) =>
    wasm.verify(verifyingKey, messageHex, signature),

  selfTest: (n: number, t: number) => json<SelfTestReport>(wasm.selfTest(n, t)),
};
