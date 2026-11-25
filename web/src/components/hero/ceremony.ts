/**
 * Shared constants for the hero illustration. Kept separate from the 3D scene
 * so the HUD can import them without pulling three.js into the main bundle.
 */
export const PLAYERS = ["Asha", "Kabir", "Meera", "Rohan", "Zoya"] as const;
export const THRESHOLD = 3;

export type CeremonyPhase = {
  /** Indices of the shares that sign this round. */
  signers: readonly number[];
  /** How many signature shares have reached the key so far. */
  arrived: number;
  /** True once the threshold is met and the signature aggregates. */
  complete: boolean;
};
