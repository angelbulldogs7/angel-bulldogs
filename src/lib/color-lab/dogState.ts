import { getPreset } from "../../data/color-lab/presets";
import { baselineGenotype, genotypesEqual, isSelectableOption } from "./genotype";
import type { Confirmation, DogState, LocusId } from "./types";
import { LOCUS_IDS } from "./types";

/** Complete Masked Classic Fawn starting state. Every value is Assumed. */
export function baselineDogState(): DogState {
  return { genotype: baselineGenotype(), bigRope: false, confirmation: "assumed" };
}

/** Any genotype edit clears Lab-confirmed back to Assumed. */
export function withLocus(state: DogState, locus: LocusId, option: string): DogState {
  if (!isSelectableOption(locus, option)) throw new Error(`${option} is not a selectable ${locus} genotype.`);
  if (state.genotype[locus] === option) return state;
  return {
    genotype: { ...state.genotype, [locus]: option },
    bigRope: state.bigRope,
    confirmation: "assumed",
  };
}

/** Big Rope is a visual preference, so toggling it leaves DNA confirmation unchanged. */
export function withBigRope(state: DogState, bigRope: boolean): DogState {
  return state.bigRope === bigRope ? state : { ...state, bigRope };
}

export function withConfirmation(state: DogState, confirmation: Confirmation): DogState {
  return state.confirmation === confirmation ? state : { ...state, confirmation };
}

/** Resets every locus, Big Rope, and confirmation before applying the preset's overrides. */
export function presetState(presetId: string): DogState | null {
  const preset = getPreset(presetId);
  if (!preset) return null;
  const genotype: Record<LocusId, string> = { ...baselineGenotype() };
  for (const locus of LOCUS_IDS) {
    const override = preset.overrides[locus];
    if (override === undefined) continue;
    if (!isSelectableOption(locus, override)) {
      throw new Error(`Preset ${presetId} has an invalid ${locus} genotype: ${override}`);
    }
    genotype[locus] = override;
  }
  return { genotype, bigRope: preset.bigRope, confirmation: "assumed" };
}

export function dogStatesEqual(a: DogState, b: DogState): boolean {
  return a.bigRope === b.bigRope && a.confirmation === b.confirmation && genotypesEqual(a.genotype, b.genotype);
}
