import { LOCI } from "./loci";

const aliasIndex = new Map<string, { locusId: (typeof LOCI)[number]["id"]; alleleId: string }>();

for (const locus of LOCI) {
  for (const allele of locus.alleles) {
    const keys = [allele.id, allele.label, ...allele.aliases, ...allele.legacyAliases];
    for (const key of keys) {
      aliasIndex.set(`${locus.id}:${key.toLowerCase()}`, { locusId: locus.id, alleleId: allele.id });
    }
  }
}

/** Normalize a lab-style label to a canonical allele ID for a known locus. */
export function normalizeAllele(locusId: (typeof LOCI)[number]["id"], raw: string): string | null {
  const hit = aliasIndex.get(`${locusId}:${raw.trim().toLowerCase()}`);
  return hit?.alleleId ?? null;
}
