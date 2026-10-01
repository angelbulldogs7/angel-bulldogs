import { getPreset } from "../../data/color-lab/presets";
import { dogStatesEqual, presetState, withBigRope, withConfirmation, withLocus } from "../../lib/color-lab/dogState";
import { canonicalOptionId, isSelectableOption, optionText, requireOption } from "../../lib/color-lab/genotype";
import type { DogState, LocusId } from "../../lib/color-lab/types";
import { LOCUS_IDS } from "../../lib/color-lab/types";

export type WorkspaceId = "build" | "stud" | "dam";

export interface WorkspaceController {
  readonly id: WorkspaceId;
  state(): DogState;
  /** Replace the whole dog (preset or saved dog) and offer Undo. */
  replace(next: DogState, message: string): void;
  applyPreset(presetId: string): void;
  subscribe(listener: (state: DogState) => void): void;
}

const STATUS_TEXT = {
  assumed: "Status: Assumed. Filled in by the tool or a preset, not a lab result.",
  confirmed: "Status: Lab-confirmed. Changing any gene or applying a preset clears this.",
  cleared: "Status: Assumed. Lab-confirmed was cleared because the DNA changed.",
} as const;

const NONVIABLE_MESSAGE = "Dup/Dup is not viable, so that combination cannot be selected.";

function isLocusId(value: string | undefined): value is LocusId {
  return (LOCUS_IDS as readonly string[]).includes(value ?? "");
}

/** True when the visible left/right pair is the same genotype as the stored option. */
function sidesMatchOption(locus: LocusId, left: string, right: string, optionId: string): boolean {
  try {
    return canonicalOptionId(locus, left, right) === optionId;
  } catch {
    return false;
  }
}

function paintAlleleButtons(gene: HTMLElement, locus: LocusId, left: string, right: string, optionId: string): void {
  gene.dataset.left = left;
  gene.dataset.right = right;
  for (const button of gene.querySelectorAll<HTMLButtonElement>("[data-allele-side][data-allele]")) {
    const side = button.dataset.alleleSide;
    const allele = button.dataset.allele;
    const selected = side === "left" ? allele === left : allele === right;
    button.setAttribute("aria-checked", selected ? "true" : "false");
  }
  const meaning = gene.querySelector<HTMLElement>("[data-gene-meaning]");
  if (meaning) meaning.textContent = optionText(locus, optionId);
}

/**
 * Sync allele radios to the stored genotype.
 * - preserve: keep the user's left/right placement when it still matches the genotype
 * - canonical: always show dominance order (presets, loads, undo)
 */
function syncAlleleButtons(
  root: HTMLElement,
  locus: LocusId,
  optionId: string,
  mode: "preserve" | "canonical",
): void {
  const gene = root.querySelector<HTMLElement>(`[data-gene][data-locus="${locus}"]`);
  if (!gene) return;
  const currentLeft = gene.dataset.left ?? "";
  const currentRight = gene.dataset.right ?? "";
  const keep =
    mode === "preserve" && currentLeft && currentRight && sidesMatchOption(locus, currentLeft, currentRight, optionId);
  const [left, right] = keep ? [currentLeft, currentRight] : requireOption(locus, optionId).alleles;
  paintAlleleButtons(gene, locus, left, right, optionId);
}

function syncBigRope(root: HTMLElement, bigRope: boolean): void {
  const control = root.querySelector<HTMLElement>("[data-big-rope-control]");
  if (!control) return;
  control.dataset.value = bigRope ? "on" : "off";
  for (const button of control.querySelectorAll<HTMLButtonElement>("[data-big-rope]")) {
    const on = button.dataset.bigRope === "on";
    button.setAttribute("aria-checked", on === bigRope ? "true" : "false");
  }
}

export function createWorkspace(
  root: HTMLElement,
  id: WorkspaceId,
  initial: DogState,
  announce: (message: string) => void,
): WorkspaceController {
  let current = initial;
  let previous: DogState | null = null;
  const listeners: ((state: DogState) => void)[] = [];
  const applied = root.querySelector<HTMLElement>("[data-applied]");
  const appliedText = root.querySelector<HTMLElement>("[data-applied-text]");
  const labBox = root.querySelector<HTMLInputElement>("[data-lab-confirmed]");
  const labStatus = root.querySelector<HTMLElement>("[data-lab-status]");

  function syncControls(
    statusOverride?: keyof typeof STATUS_TEXT,
    options: { resetSides?: boolean } = {},
  ): void {
    const mode = options.resetSides ? "canonical" : "preserve";
    for (const locus of LOCUS_IDS) syncAlleleButtons(root, locus, current.genotype[locus], mode);
    syncBigRope(root, current.bigRope);
    const confirmed = current.confirmation === "lab-confirmed";
    if (labBox) labBox.checked = confirmed;
    if (labStatus) labStatus.textContent = STATUS_TEXT[statusOverride ?? (confirmed ? "confirmed" : "assumed")];
  }

  function commit(
    next: DogState,
    options: { undo?: string; manualConfirmation?: boolean; resetSides?: boolean } = {},
  ): void {
    if (dogStatesEqual(next, current)) {
      syncControls(undefined, { resetSides: options.resetSides });
      return;
    }
    const cleared =
      !options.manualConfirmation && current.confirmation === "lab-confirmed" && next.confirmation === "assumed";
    if (options.undo) {
      previous = current;
      if (applied && appliedText) {
        appliedText.textContent = options.undo;
        applied.hidden = false;
      }
    } else {
      previous = null;
      if (applied) applied.hidden = true;
    }
    current = next;
    syncControls(cleared ? "cleared" : undefined, { resetSides: options.resetSides });
    if (cleared && !options.undo) announce("Lab-confirmed was cleared because the DNA changed.");
    for (const listener of listeners) listener(current);
  }

  function applyAllelePick(gene: HTMLElement, side: "left" | "right", allele: string): void {
    const locus = gene.dataset.locus;
    if (!isLocusId(locus)) return;
    const previousLeft = gene.dataset.left ?? "";
    const previousRight = gene.dataset.right ?? "";
    const left = side === "left" ? allele : previousLeft;
    const right = side === "right" ? allele : previousRight;
    let optionId: string;
    try {
      optionId = canonicalOptionId(locus, left, right);
    } catch {
      announce(NONVIABLE_MESSAGE);
      paintAlleleButtons(gene, locus, previousLeft, previousRight, current.genotype[locus]);
      return;
    }
    if (!isSelectableOption(locus, optionId)) {
      announce(NONVIABLE_MESSAGE);
      paintAlleleButtons(gene, locus, previousLeft, previousRight, current.genotype[locus]);
      return;
    }
    // Keep the side the user tapped; genetics still store the canonical pair.
    paintAlleleButtons(gene, locus, left, right, optionId);
    commit(withLocus(current, locus, optionId));
  }

  root.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.hasAttribute("data-lab-confirmed")) {
      commit(withConfirmation(current, target.checked ? "lab-confirmed" : "assumed"), { manualConfirmation: true });
      announce(target.checked ? "Marked as lab-confirmed." : "Marked as assumed.");
    }
  });

  root.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button") : null;
    if (!button || !root.contains(button)) return;

    const alleleSide = button.dataset.alleleSide;
    const allele = button.dataset.allele;
    if ((alleleSide === "left" || alleleSide === "right") && allele) {
      const gene = button.closest<HTMLElement>("[data-gene]");
      if (gene) applyAllelePick(gene, alleleSide, allele);
      return;
    }

    const ropeValue = button.dataset.bigRope;
    if (ropeValue === "on" || ropeValue === "off") {
      commit(withBigRope(current, ropeValue === "on"));
      return;
    }

    if (button.dataset.applyPreset) {
      controller.applyPreset(button.dataset.applyPreset);
    } else if (button.hasAttribute("data-undo") && previous) {
      const restore = previous;
      previous = null;
      if (applied) applied.hidden = true;
      commit(restore, { resetSides: true });
      announce("Previous genes restored.");
    }
  });

  const controller: WorkspaceController = {
    id,
    state: () => current,
    replace(next, message) {
      const cleared = current.confirmation === "lab-confirmed" && next.confirmation === "assumed";
      const text = cleared ? `${message} Lab-confirmed was cleared.` : message;
      commit(next, { undo: text, resetSides: true });
      announce(text);
    },
    applyPreset(presetId) {
      const next = presetState(presetId);
      const preset = getPreset(presetId);
      if (!next || !preset) return;
      controller.replace(next, `Applied the ${preset.label} preset to every gene.`);
    },
    subscribe(listener) {
      listeners.push(listener);
    },
  };

  syncControls(undefined, { resetSides: true });
  return controller;
}
