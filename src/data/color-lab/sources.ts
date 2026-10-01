export interface ColorLabSource {
  readonly title: string;
  readonly href: string;
  readonly accessed: string;
  readonly kind: "science" | "implementation";
}

const ACCESSED = "2026-09-23";

function science(title: string, href: string): ColorLabSource {
  return { title, href, accessed: ACCESSED, kind: "science" };
}

function implementation(title: string, href: string): ColorLabSource {
  return { title, href, accessed: ACCESSED, kind: "implementation" };
}

export const COLOR_LAB_SOURCES: readonly ColorLabSource[] = [
  science("UC Davis VGL — French Bulldog coat color panel", "https://vgl.ucdavis.edu/panel/dog-coat-color-french-bulldog"),
  science("UC Davis VGL — Agouti (modern ASIP haplotypes)", "https://vgl.ucdavis.edu/test/agouti-dog"),
  science("UC Davis VGL — MC1R / E locus", "https://vgl.ucdavis.edu/test/mc1r-dog"),
  science(
    "LABOKLIN — E-locus special colours (eᴬ Husky marking)",
    "https://www.laboklin.co.uk/laboklin/showGeneticTest.jsp?testID=8682",
  ),
  science("UC Davis VGL — Dominant Black (K locus)", "https://vgl.ucdavis.edu/test/dominant-black"),
  science("UC Davis VGL — Brown (TYRP1)", "https://vgl.ucdavis.edu/test/brown-dog"),
  science("UC Davis VGL — Cocoa (HPS3)", "https://vgl.ucdavis.edu/test/cocoa-dog"),
  science("UC Davis VGL — Dilute (MLPH)", "https://vgl.ucdavis.edu/test/dilute-dog"),
  science("UC Davis VGL — Piebald (MITF)", "https://vgl.ucdavis.edu/test/piebald-dog"),
  science("UC Davis VGL — Merle (PMEL)", "https://vgl.ucdavis.edu/test/merle"),
  science("UC Davis VGL — Intensity Dilution", "https://vgl.ucdavis.edu/test/intensity-dog"),
  science(
    "Hédan et al. 2019 — MFSD12 variant and phaeomelanin dilution",
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC6562630/",
  ),
  science("UC Davis VGL — SLC45A2 albinism (LAA, French Bulldog Pink)", "https://vgl.ucdavis.edu/test/albino"),
  science("UC Davis VGL — Coat length (FGF5)", "https://vgl.ucdavis.edu/test/coat-length-dog"),
  science(
    "Kupczik et al. 2017 — Dental phenotype of hairless dogs with FOXI3 haploinsufficiency",
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC5511229/",
  ),
  implementation("Astro — client-side scripts", "https://docs.astro.build/en/guides/client-side-scripts/"),
  implementation("Astro — environment variables", "https://docs.astro.build/en/guides/environment-variables/"),
  implementation("Formspree — Astro guide", "https://formspree.io/guides/astro/"),
];

export const MODEL_LIMITATIONS: readonly string[] = [
  "Every row starts filled in with an assumed genotype. Nothing is laboratory-confirmed unless you check the lab-report box for that dog.",
  "Agouti is simplified to Fawn (Aᴰʸ), Sable (Aˢʸ), And Tan (a grouped tan-point class, Aᴮᴮ; older reports use aᵗ), and Recessive Black (a). Agouti/wolf sable and black saddle are not offered separately.",
  "Dilute, Brown, and Fluffy each group every lab-reported variant into one simplified allele (d, b, and l).",
  "Merle is simplified to m/m, M/m, and M/M. Cryptic, atypical, mosaic, harlequin, and insertion-length results are not modeled.",
  "Pied and Brindle each use one representative map. White coverage, patch placement, and stripe density are not predicted.",
  "UC Davis reports that about 10% of In/In dogs do not show extreme Intensity Dilution, and some cream or white dogs have fewer than two In copies.",
  "Husky is shown only with eᴬ, kʸ/kʸ, and And Tan. LABOKLIN reports that eᴬ can also let Agouti show through Dominant Black; this tool does not model that.",
  "FOXI3 hairlessness was characterized in hairless breeds such as the Chinese Crested. This tool applies the same model and treats Dup/Dup as nonviable at conception.",
  "Eye color is a representative choice (Pink → light blue, visible Merle → blue, otherwise dark brown), not a prediction.",
  "Lilac, Isabella, New Shade Rojo, New Shade Isabella, Platinum, and Big Rope are breeder-facing names layered over the DNA shown, not universal laboratory nomenclature.",
  "Big Rope is a visual preference and is never genetically calculated.",
];
