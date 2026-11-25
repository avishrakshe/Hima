/* tslint:disable */
/* eslint-disable */

/**
 * Coordinator. `shares`: JSON `{index: hex}`. Returns `{ok, signature, randomized_key, culprits, error}`.
 */
export function aggregate(signing_package: string, shares: string, public_key_package: string, randomizer_seed: string): string;

/**
 * DKG part 1. Returns `{secret, package}`.
 */
export function dkgPart1(index: number, max_signers: number, min_signers: number): string;

/**
 * DKG part 2. `round1_packages`: JSON `{index: hex}` of the *other* players. Returns `{secret, packages}`.
 */
export function dkgPart2(secret: string, round1_packages: string): string;

/**
 * DKG part 3. Returns `{key_package, public_key_package, group_key}`.
 */
export function dkgPart3(round2_secret: string, round1_packages: string, round2_packages: string): string;

/**
 * Coordinator. `commitments`: JSON `{index: hex}`; `message_hex`: the bytes to sign.
 * Returns `{signing_package, randomizer_seed, randomized_key}`.
 */
export function newSigningRound(commitments: string, message_hex: string, public_key_package: string): string;

/**
 * Runs the whole game (DKG, two re-randomized signatures, one cheater) in one call.
 */
export function selfTest(n: number, t: number): string;

/**
 * Signing round 1. Returns `{nonces, commitments}`.
 */
export function signCommit(key_package: string): string;

/**
 * Signing round 2. Returns the signature share as a JSON string (hex).
 */
export function signShare(signing_package: string, nonces: string, key_package: string, randomizer_seed: string): string;

/**
 * Level 2: a deliberately invalid share (signs a different message). Labelled "simulated cheater" in the UI.
 */
export function signShareCheating(signing_package: string, nonces: string, key_package: string, randomizer_seed: string): string;

/**
 * Verify a signature under any RedPallas verifying key. Returns `true`/`false`.
 */
export function verify(verifying_key: string, message_hex: string, signature: string): boolean;

/**
 * Library + ciphersuite identification, shown in the game's "about" panel.
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly aggregate: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number, number];
    readonly dkgPart1: (a: number, b: number, c: number) => [number, number, number, number];
    readonly dkgPart2: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly dkgPart3: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly newSigningRound: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly selfTest: (a: number, b: number) => [number, number, number, number];
    readonly signCommit: (a: number, b: number) => [number, number, number, number];
    readonly signShare: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number, number];
    readonly signShareCheating: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number, number];
    readonly verify: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly version: () => [number, number];
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
