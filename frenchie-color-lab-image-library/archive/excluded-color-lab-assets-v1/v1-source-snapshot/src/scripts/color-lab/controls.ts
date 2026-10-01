import { LOCUS_IDS } from "../../data/color-lab/loci";
import { canonicalizePair, cloneGenotype, formatPair } from "../../lib/color-lab/genotype";
import type { AlleleProvenance, Genotype, LocusId, ProvenanceMap } from "../../lib/color-lab/types";

export function readGenotype(scope: ParentNode, prefix: string): Genotype {
  const genotype = {} as Genotype;
  for (const id of LOCUS_IDS) {
    const a = scope.querySelector<HTMLInputElement>(`input[name="${prefix}-${id}-0"]:checked`);
    const b = scope.querySelector<HTMLInputElement>(`input[name="${prefix}-${id}-1"]:checked`);
    if (!a || !b) {
      throw new Error(`Incomplete genotype for ${prefix} ${id}`);
    }
    genotype[id] = canonicalizePair(id, a.value, b.value);
  }
  return genotype;
}

export function writeGenotype(scope: ParentNode, prefix: string, genotype: Genotype): void {
  for (const id of LOCUS_IDS) {
    const pair = canonicalizePair(id, genotype[id][0], genotype[id][1]);
    const a = scope.querySelector<HTMLInputElement>(`input[name="${prefix}-${id}-0"][value="${pair[0]}"]`);
    const b = scope.querySelector<HTMLInputElement>(`input[name="${prefix}-${id}-1"][value="${pair[1]}"]`);
    if (a) a.checked = true;
    if (b) b.checked = true;
  }
}

export function readProvenance(scope: ParentNode, prefix: string): ProvenanceMap {
  const map = {} as ProvenanceMap;
  for (const id of LOCUS_IDS) {
    const card = scope.querySelector<HTMLElement>(`[data-locus-card][data-prefix="${prefix}"][data-locus="${id}"]`);
    const value = card?.dataset.provenance;
    map[id] = value === "confirmed" ? "confirmed" : "assumed";
  }
  return map;
}

export function writeProvenance(scope: ParentNode, prefix: string, provenance: ProvenanceMap): void {
  for (const id of LOCUS_IDS) {
    setLocusProvenance(scope, prefix, id, provenance[id]);
  }
}

export function setLocusProvenance(
  scope: ParentNode,
  prefix: string,
  locusId: LocusId,
  provenance: AlleleProvenance,
): void {
  const card = scope.querySelector<HTMLElement>(
    `[data-locus-card][data-prefix="${prefix}"][data-locus="${locusId}"]`,
  );
  if (!card) return;
  card.dataset.provenance = provenance;
  const label = card.querySelector<HTMLElement>("[data-provenance]");
  if (label) label.textContent = provenance === "confirmed" ? "User-entered" : "Assumed";
}

export function assumedAll(): ProvenanceMap {
  const map = {} as ProvenanceMap;
  for (const id of LOCUS_IDS) map[id] = "assumed";
  return map;
}

export function updateLocusLabels(scope: ParentNode, prefix: string, genotype: Genotype): void {
  for (const id of LOCUS_IDS) {
    const card = scope.querySelector<HTMLElement>(
      `[data-locus-card][data-prefix="${prefix}"][data-locus="${id}"]`,
    );
    const label = card?.querySelector<HTMLElement>("[data-genotype-label]");
    if (label) label.textContent = formatPair(id, genotype[id]);
  }
}

export function snapshotControls(
  scope: ParentNode,
  prefix: string,
): { genotype: Genotype; provenance: ProvenanceMap } {
  const genotype = readGenotype(scope, prefix);
  updateLocusLabels(scope, prefix, genotype);
  return { genotype: cloneGenotype(genotype), provenance: readProvenance(scope, prefix) };
}
