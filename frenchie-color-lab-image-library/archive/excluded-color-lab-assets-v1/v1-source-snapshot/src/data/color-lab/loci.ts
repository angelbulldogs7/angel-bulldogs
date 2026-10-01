import type { AlleleDefinition, LocusDefinition, LocusId } from "../../lib/color-lab/types";

function allele(
  id: string,
  label: string,
  rest: Partial<Omit<AlleleDefinition, "id" | "label">> = {},
): AlleleDefinition {
  return {
    id,
    label,
    aliases: rest.aliases ?? [],
    legacyAliases: rest.legacyAliases ?? [],
    kind: rest.kind ?? "variant",
    help: rest.help ?? "",
  };
}

export const LOCI: readonly LocusDefinition[] = [
  {
    id: "asip",
    publicName: "Agouti / base pattern",
    gene: "ASIP",
    notation: "A",
    group: "base-pigment",
    displayOrder: ["dy", "sy", "bs", "a"],
    defaultPair: ["dy", "dy"],
    guidedHelp:
      "When the K locus allows it, ASIP decides fawn, shaded fawn, tan points, or recessive black. Modern labs report haplotypes; Ay, at, and a are the familiar legacy names.",
    advancedHint: "DY > SY > BS > a. Visible only if K is ky/ky (no KB, and not solely brindle-masked).",
    inheritanceHint: "Each parent passes one haplotype. Fawn (DY) is dominant to tan-point (BS) and recessive black (a).",
    alleles: [
      allele("dy", "DY", {
        aliases: ["DY", "Ay"],
        legacyAliases: ["Ay", "ay"],
        kind: "dominant",
        help: "Dominant yellow / fawn haplotype (legacy Ay).",
      }),
      allele("sy", "SY", {
        aliases: ["SY"],
        legacyAliases: ["Ay-shaded"],
        help: "Shaded-yellow haplotype. Often not visually distinct from DY in Frenchies.",
      }),
      allele("bs", "BS", {
        aliases: ["BS", "at"],
        legacyAliases: ["at", "a^t"],
        help: "Black-saddle / tan-point haplotype (legacy at).",
      }),
      allele("a", "a", {
        aliases: ["a", "a/a"],
        legacyAliases: ["a"],
        help: "Recessive black haplotype.",
      }),
    ],
  },
  {
    id: "tyrp1",
    publicName: "Brown / chocolate",
    gene: "TYRP1",
    notation: "B",
    group: "base-pigment",
    displayOrder: ["B", "bs", "bd", "bc"],
    defaultPair: ["B", "B"],
    guidedHelp:
      "Two loss-of-function alleles, including mixed pairs such as bs/bd, make eumelanin brown/chocolate instead of black. Labs do not all number variants the same way.",
    advancedHint: "Any two LoF alleles (bs, bd, bc) express brown. B is functional.",
    inheritanceHint: "Recessive: brown shows only with two compatible LoF copies.",
    alleles: [
      allele("B", "B", { kind: "wild-type", aliases: ["B"], help: "Functional black eumelanin." }),
      allele("bs", "b^s", { aliases: ["bs", "b^s", "b"], kind: "loss-of-function", help: "TYRP1 brown variant s." }),
      allele("bd", "b^d", { aliases: ["bd", "b^d"], kind: "loss-of-function", help: "TYRP1 brown variant d." }),
      allele("bc", "b^c", { aliases: ["bc", "b^c"], kind: "loss-of-function", help: "TYRP1 brown variant c." }),
    ],
  },
  {
    id: "cocoa",
    publicName: "Cocoa",
    gene: "HPS3",
    notation: "Co",
    group: "base-pigment",
    displayOrder: ["Co", "co"],
    defaultPair: ["Co", "Co"],
    guidedHelp:
      "Cocoa is a separate gene from chocolate (TYRP1). Two cocoa alleles change eumelanin toward the cocoa phenotype. Combined with brown and dilute it produces names breeders often call New Shade or Isabella.",
    advancedHint: "co/co expresses cocoa. Distinct from TYRP1 brown.",
    inheritanceHint: "Recessive. Carriers (Co/co) look like non-cocoa dogs.",
    alleles: [
      allele("Co", "Co", { kind: "wild-type", aliases: ["Co", "CO"], help: "Functional HPS3." }),
      allele("co", "co", { kind: "loss-of-function", aliases: ["co"], help: "Recessive cocoa." }),
    ],
  },
  {
    id: "dilute",
    publicName: "Dilution",
    gene: "MLPH",
    notation: "D",
    group: "base-pigment",
    displayOrder: ["D", "d1", "d2", "d3"],
    defaultPair: ["D", "D"],
    guidedHelp:
      "Two dilute alleles lighten eumelanin (black to blue, chocolate to lilac, cocoa to Isabella). Known variants do not explain every dilute-looking dog.",
    advancedHint: "Any pair of d1, d2, or d3 expresses dilution, including compounds.",
    inheritanceHint: "Recessive. Compound heterozygotes still dilute.",
    alleles: [
      allele("D", "D", { kind: "wild-type", aliases: ["D"], help: "No MLPH dilution." }),
      allele("d1", "d1", { kind: "loss-of-function", aliases: ["d1", "d"], help: "Common MLPH dilute variant." }),
      allele("d2", "d2", { kind: "loss-of-function", aliases: ["d2"], help: "MLPH d2 dilute variant." }),
      allele("d3", "d3", { kind: "loss-of-function", aliases: ["d3"], help: "MLPH d3 dilute variant." }),
    ],
  },
  {
    id: "k",
    publicName: "Dominant black / brindle",
    gene: "CBD103",
    notation: "K",
    group: "base-pigment",
    displayOrder: ["KB", "kbr", "ky"],
    defaultPair: ["ky", "ky"],
    guidedHelp:
      "KB hides fawn and tan-point patterns (solid eumelanin). kbr allows brindle. ky/ky lets ASIP show. The K locus is resolved before ASIP visibility.",
    advancedHint: "KB > kbr > ky.",
    inheritanceHint: "KB is dominant. Brindle needs kbr without KB.",
    alleles: [
      allele("KB", "KB", { kind: "dominant", aliases: ["KB", "K^B"], help: "Dominant black." }),
      allele("kbr", "kbr", { aliases: ["kbr", "Kbr", "k^br"], help: "Brindle permission." }),
      allele("ky", "ky", { kind: "wild-type", aliases: ["ky", "k^y"], help: "Allows ASIP patterns." }),
    ],
  },
  {
    id: "mc1r",
    publicName: "Extension / mask / cream",
    gene: "MC1R",
    notation: "E",
    group: "base-pigment",
    displayOrder: ["Em", "E", "e"],
    defaultPair: ["Em", "Em"],
    guidedHelp:
      "Em can add a melanistic mask. Two recessive e alleles produce cream/red and hide brindle, tan points, and most eumelanin patterning in the coat, while those genes remain in the genotype.",
    advancedHint: "Em > E > e. e/e masks coat eumelanin pattern. Husky-specific alleles are not offered.",
    inheritanceHint: "Cream is recessive (e/e). Mask needs at least one Em and a coat that can show eumelanin.",
    alleles: [
      allele("Em", "Em", { kind: "dominant", aliases: ["Em", "E^m"], help: "Melanistic mask." }),
      allele("E", "E", { kind: "wild-type", aliases: ["E"], help: "Unrestricted extension, no mask." }),
      allele("e", "e", { kind: "loss-of-function", aliases: ["e"], help: "Recessive red/cream." }),
    ],
  },
  {
    id: "mitf",
    publicName: "White spotting / pied",
    gene: "MITF",
    notation: "S",
    group: "pattern",
    displayOrder: ["N", "S"],
    defaultPair: ["N", "N"],
    guidedHelp:
      "Pied-associated alleles increase white spotting, but the exact patch map cannot be predicted from genotype. N/S dogs range from nearly solid to flashy.",
    advancedHint: "N = no piebald insertion. S = piebald-associated MITF allele.",
    inheritanceHint: "White extent is variable. S/S tends toward more white than N/S, with overlap.",
    alleles: [
      allele("N", "N", { kind: "wild-type", aliases: ["N", "S^N", "+"], help: "No piebald-associated insertion." }),
      allele("S", "S", { aliases: ["S", "sp", "s^p"], help: "Pied-associated spotting allele." }),
    ],
  },
  {
    id: "merle",
    publicName: "Merle",
    gene: "PMEL",
    notation: "M",
    group: "pattern",
    displayOrder: ["M", "m"],
    defaultPair: ["m", "m"],
    guidedHelp:
      "This tool uses a simplified M/m selector. It does not model cryptic, atypical, harlequin, mosaic, or insertion-length merle. M/M is calculated and flagged as a genetically concerning outcome.",
    advancedHint: "Simplified biallelic merle. M/M is concerning, not hidden.",
    inheritanceHint: "Merle is visible on eumelanin. Hidden merle still appears in genotype details when cream or pink masks the coat.",
    alleles: [
      allele("M", "M", { kind: "dominant", aliases: ["M"], help: "Merle (simplified)." }),
      allele("m", "m", { kind: "wild-type", aliases: ["m", "+"], help: "Non-merle." }),
    ],
  },
  {
    id: "intensity",
    publicName: "Red intensity",
    gene: "MFSD12",
    notation: "I",
    group: "modifiers",
    displayOrder: ["I", "i"],
    defaultPair: ["I", "I"],
    guidedHelp:
      "This testable modifier explains only part of cream-to-red variation. The tool will not promise an exact shade from genotype alone.",
    advancedHint: "i/i is treated as lighter pheomelanin. Heterozygotes stay with the deeper group plus a caveat.",
    inheritanceHint: "Partial. Many other genes and environment affect red intensity.",
    alleles: [
      allele("I", "I", { kind: "wild-type", aliases: ["I", "Int"], help: "Non-reduced intensity allele." }),
      allele("i", "i", { aliases: ["i"], help: "Intensity-reducing variant." }),
    ],
  },
  {
    id: "slc45a2",
    publicName: "Pink / albinism",
    gene: "SLC45A2",
    notation: "C",
    group: "modifiers",
    displayOrder: ["C", "ca"],
    defaultPair: ["C", "C"],
    guidedHelp:
      "Two copies are associated with the SLC45A2 recessive albinism phenotype often called Pink. It visually masks ordinary pigment while the rest of the genotype is still listed.",
    advancedHint: "ca/ca expresses Pink and masks ordinary pigment resolution.",
    inheritanceHint: "Recessive. Not a pigment-color choice in the usual sense; it overrides visible color.",
    alleles: [
      allele("C", "C", { kind: "wild-type", aliases: ["C", "N"], help: "No SLC45A2 albinism genotype." }),
      allele("ca", "ca", {
        kind: "loss-of-function",
        aliases: ["ca", "p", "Pink"],
        help: "Recessive SLC45A2 albinism-associated allele.",
      }),
    ],
  },
  {
    id: "fgf5",
    publicName: "Long hair / fluffy",
    gene: "FGF5",
    notation: "L",
    group: "coat-type",
    displayOrder: ["N", "L1", "L2", "L3", "L4", "L5"],
    defaultPair: ["N", "N"],
    guidedHelp:
      "Two compatible long-hair variants, including mixed pairs, produce the fluffy/long coat. L4 is the variant most often discussed in French Bulldogs. Hairless, when expressed, is shown instead of a fluffy image.",
    advancedHint: "Any two LoF alleles (L1–L5) express long hair. N is short coat.",
    inheritanceHint: "Recessive long hair. Compound LoF combinations count.",
    alleles: [
      allele("N", "N", { kind: "wild-type", aliases: ["N", "+", "G"], help: "Short coat / no FGF5 LoF." }),
      allele("L1", "L1", { kind: "loss-of-function", aliases: ["L1", "FGF5-1"], help: "Coat-length variant 1." }),
      allele("L2", "L2", { kind: "loss-of-function", aliases: ["L2"], help: "Coat-length variant 2." }),
      allele("L3", "L3", { kind: "loss-of-function", aliases: ["L3"], help: "Coat-length variant 3." }),
      allele("L4", "L4", { kind: "loss-of-function", aliases: ["L4"], help: "French Bulldog-associated long-hair variant." }),
      allele("L5", "L5", { kind: "loss-of-function", aliases: ["L5"], help: "Coat-length variant 5." }),
    ],
  },
  {
    id: "foxi3",
    publicName: "Hairless",
    gene: "FOXI3",
    notation: "Hr",
    group: "coat-type",
    displayOrder: ["N", "Dup"],
    defaultPair: ["N", "N"],
    guidedHelp:
      "One duplication copy is associated with a hairless/ectodermal-dysplasia phenotype. Two copies are treated as a presumed embryonic-lethal conception outcome, not as a puppy that can be born.",
    advancedHint: "N/Dup = hairless phenotype. Dup/Dup = nonviable conception class.",
    inheritanceHint: "Do not treat Dup/Dup as a live puppy card. Pairing two carriers is flagged.",
    alleles: [
      allele("N", "N", { kind: "wild-type", aliases: ["N", "+"], help: "No FOXI3 hairless duplication." }),
      allele("Dup", "Dup", { aliases: ["Dup", "Hr", "hr"], help: "FOXI3 hairless duplication." }),
    ],
  },
  {
    id: "krt71",
    publicName: "Curl",
    gene: "KRT71",
    notation: "Cu",
    group: "coat-type",
    displayOrder: ["N", "C1", "C2"],
    defaultPair: ["N", "N"],
    guidedHelp:
      "Curl is dosage-sensitive and also depends on coat length. One variant copy may wave the coat; two copies usually curl more strongly. Short coats may hide much of the effect.",
    advancedHint: "One C1 or C2: wavy influence. Two variant copies: stronger curl. Cautious, not guaranteed.",
    inheritanceHint: "Incomplete dominance / dosage. Visible curl is clearer on longer coats.",
    alleles: [
      allele("N", "N", { kind: "wild-type", aliases: ["N", "+", "cu"], help: "Non-curl KRT71." }),
      allele("C1", "C1", { aliases: ["C1", "Cu^C1"], help: "Curl variant 1." }),
      allele("C2", "C2", { aliases: ["C2", "Cu^C2"], help: "Curl variant 2." }),
    ],
  },
  {
    id: "rspo2",
    publicName: "Furnishings",
    gene: "RSPO2",
    notation: "F",
    group: "coat-type",
    displayOrder: ["F", "ic"],
    defaultPair: ["ic", "ic"],
    guidedHelp:
      "Furnishings (eyebrow/muzzle furnishings) is dominant. Most French Bulldogs are unfurnished; this locus is included because it appears on some commercial coat-type panels.",
    advancedHint: "One F copy can express furnishings.",
    inheritanceHint: "Dominant. ic/ic is unfurnished.",
    alleles: [
      allele("F", "F", { kind: "dominant", aliases: ["F", "IC"], help: "Furnishings." }),
      allele("ic", "ic", { kind: "wild-type", aliases: ["ic", "n", "N"], help: "No furnishings / improper coat." }),
    ],
  },
];

export const LOCUS_IDS = LOCI.map((locus) => locus.id) as LocusId[];

export const LOCUS_GROUPS: { id: LocusDefinition["group"]; title: string }[] = [
  { id: "base-pigment", title: "Base pigment" },
  { id: "pattern", title: "Pattern & markings" },
  { id: "modifiers", title: "Pigment modifiers" },
  { id: "coat-type", title: "Coat type" },
];

export function getLocus(id: LocusId): LocusDefinition {
  const locus = LOCI.find((item) => item.id === id);
  if (!locus) throw new Error(`Unknown locus: ${id}`);
  return locus;
}

export function isLofTyrp1(id: string): boolean {
  return id === "bs" || id === "bd" || id === "bc";
}

export function isDiluteAllele(id: string): boolean {
  return id === "d1" || id === "d2" || id === "d3";
}

export function isFgf5Lof(id: string): boolean {
  return id === "L1" || id === "L2" || id === "L3" || id === "L4" || id === "L5";
}

export function isKrt71Curl(id: string): boolean {
  return id === "C1" || id === "C2";
}
