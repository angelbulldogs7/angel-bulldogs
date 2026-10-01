import type { Genotype } from "../../lib/color-lab/types";
import { bothAre, countAllele, hasAllele } from "../../lib/color-lab/genotype";
import { isDiluteAllele, isFgf5Lof, isKrt71Curl, isLofTyrp1 } from "./loci";

export type EumelaninColor =
  | "black"
  | "blue"
  | "chocolate"
  | "lilac"
  | "cocoa"
  | "isabella"
  | "new-shade"
  | "new-shade-isabella";

export type PatternClass = "solid" | "fawn" | "shaded-fawn" | "brindle" | "tan-point";

export interface NameParts {
  commonName: string;
  slug: string;
  breederTerm: boolean;
  scientificDescription: string;
}

const EUMELANIN: Record<
  EumelaninColor,
  { name: string; slug: string; breederTerm: boolean; science: string }
> = {
  black: { name: "Black", slug: "black", breederTerm: false, science: "black eumelanin" },
  blue: { name: "Blue", slug: "blue", breederTerm: false, science: "dilute black eumelanin" },
  chocolate: { name: "Chocolate", slug: "chocolate", breederTerm: false, science: "TYRP1 brown eumelanin" },
  lilac: {
    name: "Lilac",
    slug: "lilac",
    breederTerm: true,
    science: "TYRP1 brown with MLPH dilution",
  },
  cocoa: { name: "Cocoa", slug: "cocoa", breederTerm: false, science: "HPS3 cocoa eumelanin" },
  isabella: {
    name: "Isabella",
    slug: "isabella",
    breederTerm: true,
    science: "HPS3 cocoa with MLPH dilution",
  },
  "new-shade": {
    name: "New Shade",
    slug: "new-shade",
    breederTerm: true,
    science: "TYRP1 brown combined with HPS3 cocoa",
  },
  "new-shade-isabella": {
    name: "New Shade Isabella",
    slug: "new-shade-isabella",
    breederTerm: true,
    science: "TYRP1 brown, HPS3 cocoa, and MLPH dilution",
  },
};

export function eumelaninColor(brown: boolean, cocoa: boolean, dilute: boolean): EumelaninColor {
  if (brown && cocoa && dilute) return "new-shade-isabella";
  if (brown && cocoa) return "new-shade";
  if (brown && dilute) return "lilac";
  if (cocoa && dilute) return "isabella";
  if (brown) return "chocolate";
  if (cocoa) return "cocoa";
  if (dilute) return "blue";
  return "black";
}

export function isBrownExpressed(genotype: Genotype): boolean {
  return bothAre(genotype.tyrp1, isLofTyrp1);
}

export function isCocoaExpressed(genotype: Genotype): boolean {
  return genotype.cocoa[0] === "co" && genotype.cocoa[1] === "co";
}

export function isDiluteExpressed(genotype: Genotype): boolean {
  return bothAre(genotype.dilute, isDiluteAllele);
}

export function isCreamExpressed(genotype: Genotype): boolean {
  return genotype.mc1r[0] === "e" && genotype.mc1r[1] === "e";
}

export function isPinkExpressed(genotype: Genotype): boolean {
  return genotype.slc45a2[0] === "ca" && genotype.slc45a2[1] === "ca";
}

export function isFluffyExpressed(genotype: Genotype): boolean {
  return bothAre(genotype.fgf5, isFgf5Lof);
}

export function isHairlessExpressed(genotype: Genotype): boolean {
  return countAllele(genotype.foxi3, "Dup") === 1;
}

export function isHairlessLethal(genotype: Genotype): boolean {
  return genotype.foxi3[0] === "Dup" && genotype.foxi3[1] === "Dup";
}

export function kClass(genotype: Genotype): "KB" | "kbr" | "ky" {
  if (hasAllele(genotype.k, "KB")) return "KB";
  if (hasAllele(genotype.k, "kbr")) return "kbr";
  return "ky";
}

export function asipClass(genotype: Genotype): "dy" | "sy" | "bs" | "a" {
  if (hasAllele(genotype.asip, "dy")) return "dy";
  if (hasAllele(genotype.asip, "sy")) return "sy";
  if (hasAllele(genotype.asip, "bs")) return "bs";
  return "a";
}

export function curlClass(genotype: Genotype): "none" | "wavy" | "curly" {
  const copies = (isKrt71Curl(genotype.krt71[0]) ? 1 : 0) + (isKrt71Curl(genotype.krt71[1]) ? 1 : 0);
  if (copies >= 2) return "curly";
  if (copies === 1) return "wavy";
  return "none";
}

export function merleZygosity(genotype: Genotype): "none" | "hetero" | "homo" {
  const copies = countAllele(genotype.merle, "M");
  if (copies === 2) return "homo";
  if (copies === 1) return "hetero";
  return "none";
}

export function resolvePattern(genotype: Genotype): PatternClass {
  const k = kClass(genotype);
  if (k === "KB") return "solid";
  if (k === "kbr") return "brindle";
  const asip = asipClass(genotype);
  if (asip === "dy") return "fawn";
  if (asip === "sy") return "shaded-fawn";
  if (asip === "bs") return "tan-point";
  return "solid";
}

/**
 * Naming precedence (independent of UI order):
 * 1. Pink, if expressed, is the pigment name.
 * 2. Recessive red/cream (e/e) uses the cream/rojo family.
 * 3. Otherwise pattern + eumelanin color.
 * 4. Visible merle, then pied.
 * 5. Coat: hairless, else fluffy / curl / furnishings.
 */
export function nameFromTraits(input: {
  pink: boolean;
  cream: boolean;
  cocoa: boolean;
  brown: boolean;
  lightIntensity: boolean;
  pattern: PatternClass;
  color: EumelaninColor;
  merleVisible: boolean;
  pied: boolean;
  hairless: boolean;
  fluffy: boolean;
  curl: "none" | "wavy" | "curly";
  furnished: boolean;
}): NameParts {
  let breederTerm = false;
  const pigment = pigmentName(input);
  breederTerm = pigment.breederTerm;

  const chunks: string[] = [pigment.name];
  const slugParts: string[] = [pigment.slug];

  if (input.merleVisible) {
    chunks.push("Merle");
    slugParts.push("merle");
  }
  if (input.pied) {
    chunks.push("Pied");
    slugParts.push("pied");
  }

  if (input.hairless) {
    chunks.push("Hairless");
    slugParts.push("hairless");
  } else {
    if (input.fluffy) {
      chunks.push("Fluffy");
      slugParts.push("fluffy");
    }
    if (input.curl === "curly") {
      chunks.push("Curly");
      slugParts.push("curly");
    } else if (input.curl === "wavy") {
      chunks.push("Wavy");
      slugParts.push("wavy");
    }
    if (input.furnished) {
      chunks.push("Furnished");
      slugParts.push("furnished");
    }
  }

  return {
    commonName: chunks.join(" "),
    slug: slugParts.join("-"),
    breederTerm,
    scientificDescription: pigment.science,
  };
}

function pigmentName(input: {
  pink: boolean;
  cream: boolean;
  cocoa: boolean;
  brown: boolean;
  lightIntensity: boolean;
  pattern: PatternClass;
  color: EumelaninColor;
}): { name: string; slug: string; breederTerm: boolean; science: string } {
  if (input.pink) {
    return {
      name: "Pink",
      slug: "pink",
      breederTerm: false,
      science: "SLC45A2 recessive albinism-associated phenotype masking ordinary pigment",
    };
  }
  if (input.cream) {
    if (input.brown && input.cocoa) {
      return {
        name: "New Shade Rojo",
        slug: "new-shade-rojo",
        breederTerm: true,
        science: "MC1R e/e with TYRP1 brown and HPS3 cocoa (breeder term)",
      };
    }
    if (input.cocoa) {
      return {
        name: "Rojo",
        slug: "rojo",
        breederTerm: true,
        science: "MC1R e/e with HPS3 cocoa (breeder term)",
      };
    }
    return {
      name: input.lightIntensity ? "Cream" : "Cream",
      slug: "cream",
      breederTerm: false,
      science: "MC1R recessive red/cream; shade is not fully determined by MFSD12",
    };
  }

  const eu = EUMELANIN[input.color];
  if (input.pattern === "fawn" || input.pattern === "shaded-fawn") {
    const shaded = input.pattern === "shaded-fawn";
    if (input.color === "black") {
      return {
        name: shaded ? "Shaded Fawn" : "Fawn",
        slug: shaded ? "shaded-fawn" : "fawn",
        breederTerm: false,
        science: "ASIP fawn/yellow with ky/ky",
      };
    }
    return {
      name: `${eu.name} Fawn`,
      slug: `${eu.slug}-fawn`,
      breederTerm: eu.breederTerm,
      science: `${eu.science} on an ASIP fawn pattern`,
    };
  }
  if (input.pattern === "brindle") {
    if (input.color === "black") {
      return { name: "Brindle", slug: "brindle", breederTerm: false, science: "CBD103 kbr brindle" };
    }
    return {
      name: `${eu.name} Brindle`,
      slug: `${eu.slug}-brindle`,
      breederTerm: eu.breederTerm,
      science: `${eu.science} with kbr brindle`,
    };
  }
  if (input.pattern === "tan-point") {
    return {
      name: `${eu.name} and Tan`,
      slug: `${eu.slug}-tan-point`,
      breederTerm: eu.breederTerm,
      science: `${eu.science} with ASIP tan points`,
    };
  }
  return {
    name: eu.name,
    slug: eu.slug,
    breederTerm: eu.breederTerm,
    science: eu.science,
  };
}
