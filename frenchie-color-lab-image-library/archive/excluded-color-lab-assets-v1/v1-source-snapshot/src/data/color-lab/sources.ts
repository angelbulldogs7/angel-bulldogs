export const COLOR_LAB_SOURCES = [
  {
    title: "UC Davis VGL — French Bulldog coat color panel",
    href: "https://vgl.ucdavis.edu/panel/dog-coat-color-french-bulldog",
    accessed: "2026-09-01",
  },
  {
    title: "UC Davis VGL — Agouti / ASIP",
    href: "https://vgl.ucdavis.edu/test/agouti-dog",
    accessed: "2026-09-01",
  },
  {
    title: "UC Davis VGL — MC1R / E locus",
    href: "https://vgl.ucdavis.edu/test/mc1r-dog",
    accessed: "2026-09-01",
  },
  {
    title: "UC Davis VGL — Dilution / MLPH",
    href: "https://vgl.ucdavis.edu/test/dilute-dog",
    accessed: "2026-09-01",
  },
  {
    title: "UC Davis VGL — Piebald / MITF",
    href: "https://vgl.ucdavis.edu/test/piebald-dog",
    accessed: "2026-09-01",
  },
  {
    title: "UC Davis VGL — Merle / PMEL",
    href: "https://vgl.ucdavis.edu/test/merle",
    accessed: "2026-09-01",
  },
  {
    title: "UC Davis VGL — Coat length / FGF5",
    href: "https://vgl.ucdavis.edu/test/coat-length-dog",
    accessed: "2026-09-01",
  },
  {
    title: "UC Davis VGL — Intensity / MFSD12",
    href: "https://vgl.ucdavis.edu/test/intensity-dog",
    accessed: "2026-09-01",
  },
  {
    title: "UC Davis VGL — SLC45A2 albinism",
    href: "https://vgl.ucdavis.edu/test/albino",
    accessed: "2026-09-01",
  },
  {
    title: "UC Davis VGL — Curl / KRT71",
    href: "https://vgl.ucdavis.edu/test/curl",
    accessed: "2026-09-01",
  },
  {
    title: "UC Davis VGL — Furnishings / RSPO2",
    href: "https://vgl.ucdavis.edu/test/furnishings-and-improper-coat",
    accessed: "2026-09-01",
  },
  {
    title: "HPS3 cocoa in French Bulldogs (Kiener et al.)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7349258/",
    accessed: "2026-09-01",
  },
  {
    title: "FOXI3 duplication and canine hairlessness",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5511229/",
    accessed: "2026-09-01",
  },
  {
    title: "Broad Institute — FOXI3 hairless duplication overview",
    href: "https://www.broadinstitute.org/news/1061",
    accessed: "2026-09-01",
  },
] as const;

export const MODEL_LIMITATIONS = [
  "Merle is modeled only as M versus m. Cryptic, atypical, harlequin, mosaic, and insertion-length merle are out of scope.",
  "Pied white is a representative class, not a predicted patch map.",
  "MFSD12 intensity does not determine an exact cream-to-red shade.",
  "Known MLPH variants do not account for every dilute-appearing dog.",
  "ASIP DY and SY are often not visually distinguished in this breed; both are labeled in genotype detail.",
  "Husky marking and unvalidated “velvet” or ticking/roan traits are not included.",
  "Assumed wild-type defaults are usability defaults, not laboratory results.",
] as const;
