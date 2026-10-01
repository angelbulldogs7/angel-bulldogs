import { getPhenotypeImage } from "../../data/color-lab/imageRegistry";
import type { ResolvedPhenotype, SafetyFlag } from "../../lib/color-lab/types";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function renderList(target: HTMLElement | null, items: string[]): void {
  if (!target) return;
  target.replaceChildren();
  if (items.length === 0) {
    const li = document.createElement("li");
    li.textContent = "None listed for this genotype.";
    target.append(li);
    return;
  }
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    target.append(li);
  }
}

function renderFlags(target: HTMLElement | null, flags: SafetyFlag[]): void {
  if (!target) return;
  target.replaceChildren();
  for (const flag of flags) {
    const p = document.createElement("p");
    p.className = `cl-flag cl-flag--${flag.severity}`;
    p.textContent = flag.message;
    target.append(p);
  }
}

export function renderPreview(root: HTMLElement, phenotype: ResolvedPhenotype, announce: (text: string) => void): void {
  const name = root.querySelector<HTMLElement>("[data-common-name]");
  const geno = root.querySelector<HTMLElement>("[data-geno-summary]");
  const carried = root.querySelector<HTMLElement>("[data-carried]");
  const caveats = root.querySelector<HTMLElement>("[data-caveats]");
  const flags = root.querySelector<HTMLElement>("[data-flags]");
  const badge = root.querySelector<HTMLElement>("[data-breeder-term]");
  const imgA = root.querySelector<HTMLImageElement>("[data-preview-img='a']");
  const imgB = root.querySelector<HTMLImageElement>("[data-preview-img='b']");
  const previous = name?.textContent ?? "";

  if (name) name.textContent = phenotype.nonviable ? phenotype.commonName : phenotype.commonName;
  if (geno) geno.textContent = phenotype.genotypeSummary;
  renderList(carried, phenotype.carriedTraits);
  renderList(caveats, phenotype.caveats);
  renderFlags(flags, phenotype.safetyFlags);
  if (badge) badge.hidden = !phenotype.breederTerm;

  const image = getPhenotypeImage(phenotype.imageId, phenotype.commonName);
  const nextSrc = phenotype.nonviable ? image.src : image.src;
  swapPreviewImage(imgA, imgB, nextSrc, image.alt);

  const interest = root.querySelector<HTMLButtonElement>("[data-open-interest]");
  if (interest) interest.hidden = phenotype.nonviable;

  if (name && previous && previous !== phenotype.commonName) {
    announce(`Preview updated: ${phenotype.commonName}`);
  }
}

function swapPreviewImage(
  imgA: HTMLImageElement | null,
  imgB: HTMLImageElement | null,
  src: string,
  alt: string,
): void {
  if (!imgA) return;
  const active = imgA.classList.contains("is-active") ? imgA : imgB ?? imgA;
  const incoming = active === imgA ? imgB : imgA;
  if (!incoming || prefersReducedMotion() || active.src.endsWith(src.replace(/^\//, "")) || active.getAttribute("src") === src) {
    imgA.src = src;
    imgA.alt = alt;
    imgA.classList.add("is-active");
    imgA.hidden = false;
    if (imgB) {
      imgB.classList.remove("is-active");
      imgB.hidden = true;
    }
    return;
  }
  incoming.alt = alt;
  incoming.src = src;
  incoming.hidden = false;
  incoming.classList.add("is-active");
  active.classList.remove("is-active");
  window.setTimeout(() => {
    active.hidden = true;
  }, 280);
}
