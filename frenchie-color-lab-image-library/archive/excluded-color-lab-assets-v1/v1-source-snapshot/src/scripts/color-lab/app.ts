import { applyPreset, CLASSIC_FAWN_PRESET_ID } from "../../data/color-lab/presets";
import { LOCI } from "../../data/color-lab/loci";
import { getPhenotypeImage } from "../../data/color-lab/imageRegistry";
import { defaultGenotype, genotypesEqual } from "../../lib/color-lab/genotype";
import { calculateBreeding } from "../../lib/color-lab/inheritance";
import { resolvePhenotype } from "../../lib/color-lab/phenotypeResolver";
import { loadRequiresSexConfirm, type ParentRole } from "../../lib/color-lab/parents";
import type {
  DogSnapshot,
  Genotype,
  InterestSource,
  ProvenanceMap,
  ResolvedPhenotype,
} from "../../lib/color-lab/types";
import {
  assumedAll,
  readGenotype,
  readProvenance,
  setLocusProvenance,
  snapshotControls,
  updateLocusLabels,
  writeGenotype,
  writeProvenance,
} from "./controls";
import { initInterestDrawer } from "./drawer";
import { renderPreview } from "./preview";
import { currentSavedDogs, persistDog, removeDog, renderSavedList } from "./saved-dogs";
import { initTabs } from "./tabs";

interface BreedingInterest {
  phenotype: ResolvedPhenotype;
  sire: DogSnapshot;
  dam: DogSnapshot;
  percent: string;
}

const breedingInterest = new WeakMap<HTMLElement, BreedingInterest>();

function liveAnnounce(root: HTMLElement, text: string): void {
  const live = root.querySelector<HTMLElement>("[data-live]");
  if (live) live.textContent = text;
}

function readSex(scope: ParentNode, prefix: string): "male" | "female" {
  const checked = scope.querySelector<HTMLInputElement>(`input[name="${prefix}-dog-sex"]:checked`);
  return checked?.value === "male" ? "male" : "female";
}

function confirmDestructive(message: string): boolean {
  return window.confirm(message);
}

function applyFullGenotype(
  scope: ParentNode,
  prefix: string,
  genotype: Genotype,
  provenance: ProvenanceMap,
): void {
  writeGenotype(scope, prefix, genotype);
  writeProvenance(scope, prefix, provenance);
  updateLocusLabels(scope, prefix, genotype);
}

function refreshSavedLists(root: HTMLElement, reload: (prefix: string, id: string) => void): void {
  for (const list of root.querySelectorAll<HTMLElement>("[data-saved-list]")) {
    const prefix = list.closest<HTMLElement>("[data-saved-dogs]")?.dataset.prefix ?? "build";
    renderSavedList(
      list,
      (id) => reload(prefix, id),
      (id) => {
        if (!confirmDestructive("Delete this saved dog from this browser?")) return;
        removeDog(id);
        refreshSavedLists(root, reload);
      },
    );
  }
}

function parentSnapshot(root: HTMLElement, prefix: "stud" | "dam"): DogSnapshot {
  const { genotype, provenance } = snapshotControls(root, prefix);
  const phenotype = resolvePhenotype(genotype, provenance);
  const nameInput = root.querySelector<HTMLInputElement>(`[data-parent="${prefix}"] [data-parent-name]`);
  return {
    name: nameInput?.value.trim() || (prefix === "stud" ? "Stud" : "Dam"),
    sex: prefix === "stud" ? "male" : "female",
    genotype,
    provenance,
    phenotypeSlug: phenotype.slug,
    phenotypeName: phenotype.commonName,
  };
}

function renderReview(root: HTMLElement): void {
  for (const prefix of ["stud", "dam"] as const) {
    const target = root.querySelector<HTMLElement>(`[data-review-${prefix}]`);
    if (!target) continue;
    const snap = parentSnapshot(root, prefix);
    target.replaceChildren();
    const h = document.createElement("h3");
    h.textContent = `${prefix === "stud" ? "Stud" : "Dam"}: ${snap.name}`;
    const p = document.createElement("p");
    p.textContent = snap.phenotypeName;
    const g = document.createElement("p");
    g.textContent = resolvePhenotype(snap.genotype, snap.provenance).genotypeSummary;
    target.append(h, p, g);
  }
}

function renderBreedingResults(root: HTMLElement, sire: DogSnapshot, dam: DogSnapshot): void {
  const result = calculateBreeding(sire.genotype, dam.genotype);
  const flags = root.querySelector<HTMLElement>("[data-pairing-flags]");
  if (flags) {
    flags.replaceChildren();
    for (const flag of result.pairingFlags) {
      const p = document.createElement("p");
      p.className = `cl-flag cl-flag--${flag.severity}`;
      p.textContent = flag.message;
      flags.append(p);
    }
  }
  const most = root.querySelector<HTMLElement>("[data-most-likely]");
  if (most) {
    if (result.tiesForMostLikely) {
      most.textContent = `More than one phenotype ties for most likely: ${result.mostLikelyNames.join(", ")}.`;
    } else if (result.mostLikelyNames[0]) {
      most.textContent = `Most likely visible class: ${result.mostLikelyNames[0]}.`;
    } else {
      most.textContent = "No viable puppy phenotypes for this pairing.";
    }
  }
  const note = root.querySelector<HTMLElement>("[data-viable-note]");
  if (note) {
    note.replaceChildren();
    if (result.viableRenormalized) {
      const p = document.createElement("p");
      p.className = "cl-flag cl-flag--warning";
      p.textContent = `Dup/Dup conceptions are ${result.nonviableDisplayPercent}% at conception and are not live-puppy cards. Among potentially viable offspring, percentages are renormalized as P(phenotype at conception) ÷ (1 − P(Dup/Dup)).`;
      note.append(p);
    }
  }
  const list = root.querySelector<HTMLElement>("[data-pheno-list]");
  if (list) {
    list.replaceChildren();
    const shown = result.viableRenormalized ? result.viableOutcomes : result.conceptionOutcomes.filter((item) => !item.phenotype.nonviable);
    const nonviable = result.conceptionOutcomes.filter((item) => item.phenotype.nonviable);
    for (const row of shown) {
      list.append(phenotypeCard(row.phenotype.commonName, row.displayPercent, row.phenotype, sire, dam));
    }
    for (const row of nonviable) {
      const li = document.createElement("li");
      li.className = "cl-pheno-card cl-pheno-card--nonviable";
      const title = document.createElement("h3");
      title.textContent = `${row.phenotype.commonName} · ${row.displayPercent}% at conception`;
      const p = document.createElement("p");
      p.textContent = row.phenotype.scientificDescription;
      li.append(title, p);
      list.append(li);
    }
  }
  for (const locus of LOCI) {
    const host = root.querySelector<HTMLElement>(`[data-locus-result="${locus.id}"] [data-locus-rows]`);
    if (!host) continue;
    host.replaceChildren();
    const rows = result.locusOutcomes[LOCI.findIndex((item) => item.id === locus.id)] ?? [];
    for (const row of rows) {
      const li = document.createElement("li");
      li.className = "cl-bar-row";
      const label = document.createElement("span");
      label.textContent = `${row.label} · ${row.displayPercent}% · ${row.expression}`;
      const bar = document.createElement("span");
      bar.className = "cl-bar";
      bar.setAttribute("aria-hidden", "true");
      const fill = document.createElement("span");
      fill.style.width = `${row.displayPercent}%`;
      bar.append(fill);
      li.append(label, bar);
      host.append(li);
    }
  }
}

function phenotypeCard(
  name: string,
  percent: string,
  phenotype: ReturnType<typeof resolvePhenotype>,
  sire: DogSnapshot,
  dam: DogSnapshot,
): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "cl-pheno-card";
  const image = getPhenotypeImage(phenotype.imageId, phenotype.commonName);
  const img = document.createElement("img");
  img.src = image.src;
  img.width = image.width;
  img.height = image.height;
  img.alt = image.alt;
  img.loading = "lazy";
  const h = document.createElement("h3");
  let title = name;
  if (phenotype.slug.includes("double-merle")) title = `${name} · double merle (M/M)`;
  else if (phenotype.slug.includes("cryptic-merle")) title = `${name} · cryptic merle`;
  h.textContent = `${title}`;
  const p = document.createElement("p");
  p.textContent = `${percent}% · ${phenotype.scientificDescription}`;
  const geno = document.createElement("p");
  geno.textContent = phenotype.genotypeSummary;
  const flags = document.createElement("div");
  for (const flag of phenotype.safetyFlags.filter((item) => item.severity !== "info")) {
    const note = document.createElement("p");
    note.className = `cl-flag cl-flag--${flag.severity}`;
    note.textContent = flag.message;
    flags.append(note);
  }
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn--secondary";
  btn.textContent = "I’m Interested in This Puppy";
  btn.dataset.openInterest = "breeding";
  btn.dataset.percent = percent;
  li.append(img, h, p, geno, flags, btn);
  li.dataset.slug = phenotype.slug;
  breedingInterest.set(li, { phenotype, sire, dam, percent });
  return li;
}

export function initColorLab(): void {
  const root = document.querySelector<HTMLElement>("[data-color-lab]");
  if (root) runColorLab(root);
}

function runColorLab(root: HTMLElement): void {

  const prototypeMode = root.dataset.prototypeMode === "true";
  const endpoint = root.dataset.formspreeEndpoint ?? "";
  const openDrawer = initInterestDrawer(root, { prototypeMode, endpoint });
  initTabs(root, "[data-primary-tabs] > .cl-tabs__list");
  initTabs(root, "[data-result-tabs] > .cl-tabs__list");

  let lastBuild = defaultGenotype();
  const lastParents: Record<ParentRole, Genotype> = {
    stud: defaultGenotype(),
    dam: defaultGenotype(),
  };

  function isDirty(prefix: string, baseline: Genotype): boolean {
    try {
      const current = readGenotype(root, prefix);
      const provenance = readProvenance(root, prefix);
      return !genotypesEqual(current, baseline) || Object.values(provenance).some((item) => item === "confirmed");
    } catch {
      return false;
    }
  }

  function refreshBuild(): void {
    const { genotype, provenance } = snapshotControls(root, "build");
    const phenotype = resolvePhenotype(genotype, provenance);
    const preview = root.querySelector<HTMLElement>('[data-preview][data-prefix="build"]');
    if (preview) renderPreview(preview, phenotype, (text) => liveAnnounce(root, text));
  }

  function loadDog(prefix: string, id: string): void {
    const dog = currentSavedDogs().find((item) => item.id === id);
    if (!dog) return;
    if (prefix === "stud" || prefix === "dam") {
      if (loadRequiresSexConfirm(dog.sex, prefix)) {
        const ok = confirmDestructive(
          `This dog is recorded as ${dog.sex}. Load it as ${prefix} anyway? The saved record will not be relabeled.`,
        );
        if (!ok) return;
      }
    }
    applyFullGenotype(root, prefix, dog.genotype, dog.provenance);
    const nameField = root.querySelector<HTMLInputElement>(
      `[data-saved-dogs][data-prefix="${prefix}"] [data-dog-name], [data-parent="${prefix}"] [data-parent-name]`,
    );
    if (nameField && nameField.hasAttribute("data-dog-name")) nameField.value = dog.name;
    const parentName = root.querySelector<HTMLInputElement>(`[data-parent="${prefix}"] [data-parent-name]`);
    if (parentName) parentName.value = dog.name;
    const sexRadio = root.querySelector<HTMLInputElement>(
      `input[name="${prefix}-dog-sex"][value="${dog.sex}"]`,
    );
    if (sexRadio) sexRadio.checked = true;
    if (prefix === "build") {
      lastBuild = dog.genotype;
      refreshBuild();
    } else if (prefix === "stud" || prefix === "dam") {
      lastParents[prefix] = dog.genotype;
    }
  }

  function applyPresetTo(prefix: string, presetId: string): void {
    const next = applyPreset(presetId);
    if (!next) return;
    const baseline = prefix === "build" ? lastBuild : lastParents[prefix as ParentRole] ?? lastBuild;
    if (isDirty(prefix, baseline) && !confirmDestructive("Apply this preset? Every locus will be replaced.")) {
      return;
    }
    applyFullGenotype(root, prefix, next, assumedAll());
    if (prefix === "build") {
      lastBuild = next;
      refreshBuild();
    } else if (prefix === "stud" || prefix === "dam") {
      lastParents[prefix] = next;
    }
  }

  root.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement | null;
    if (!input?.dataset.locus || !input.name) return;
    const prefix = input.name.split("-")[0];
    if (!prefix || !input.dataset.locus) return;
    setLocusProvenance(root, prefix, input.dataset.locus as Parameters<typeof setLocusProvenance>[2], "confirmed");
    if (prefix === "build") refreshBuild();
  });

  root.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      "[data-apply-preset], [data-reset-classic], [data-save-dog], [data-open-interest], [data-step], [data-calculate], [data-edit-parents], [data-mode-option]",
    );
    if (!target) return;

    if (target.dataset.modeOption) {
      root.dataset.mode = target.dataset.modeOption;
      for (const btn of root.querySelectorAll<HTMLButtonElement>("[data-mode-option]")) {
        btn.setAttribute("aria-pressed", btn === target ? "true" : "false");
      }
      return;
    }

    if (target.dataset.applyPreset) {
      const prefix = target.closest<HTMLElement>("[data-presets]")?.dataset.prefix ?? "build";
      applyPresetTo(prefix, target.dataset.applyPreset);
      return;
    }

    if (target.hasAttribute("data-reset-classic")) {
      applyPresetTo("build", CLASSIC_FAWN_PRESET_ID);
      return;
    }

    if (target.hasAttribute("data-save-dog")) {
      const box = target.closest<HTMLElement>("[data-saved-dogs]");
      const prefix = box?.dataset.prefix ?? "build";
      const { genotype, provenance } = snapshotControls(root, prefix);
      const name = box?.querySelector<HTMLInputElement>("[data-dog-name]")?.value ?? "";
      const sex = prefix === "stud" ? "male" : prefix === "dam" ? "female" : readSex(root, prefix);
      const saved = persistDog({ name, sex, genotype, provenance });
      if (!saved) {
        window.alert("Enter a dog name before saving.");
        return;
      }
      refreshSavedLists(root, loadDog);
      liveAnnounce(root, `${saved.name} saved in this browser.`);
      return;
    }

    if (target.hasAttribute("data-open-interest")) {
      const source = (target.getAttribute("data-interest-source") ??
        target.dataset.openInterest ??
        "build") as InterestSource;
      if (source === "breeding" || target.closest(".cl-pheno-card")) {
        const card = target.closest<HTMLElement>(".cl-pheno-card");
        const payload = card ? breedingInterest.get(card) : undefined;
        if (!payload) return;
        openDrawer({
          source: "breeding",
          visitor: { fullName: "", email: "", phone: "", city: "", state: "", timeframe: "" },
          phenotype: payload.phenotype,
          genotype: payload.phenotype.exampleGenotype,
          provenance: assumedAll(),
          probability: payload.percent,
          stud: payload.sire,
          dam: payload.dam,
        });
        return;
      }
      const { genotype, provenance } = snapshotControls(root, "build");
      openDrawer({
        source: "build",
        visitor: { fullName: "", email: "", phone: "", city: "", state: "", timeframe: "" },
        phenotype: resolvePhenotype(genotype, provenance),
        genotype,
        provenance,
        probability: null,
        stud: null,
        dam: null,
      });
      return;
    }

    if (target.dataset.step) {
      showBreedingStep(root, target.dataset.step);
      if (target.dataset.step === "review") renderReview(root);
      return;
    }

    if (target.hasAttribute("data-calculate")) {
      const stud = parentSnapshot(root, "stud");
      const dam = parentSnapshot(root, "dam");
      renderBreedingResults(root, stud, dam);
      showBreedingStep(root, "results");
      liveAnnounce(root, "Litter calculation complete.");
      return;
    }

    if (target.hasAttribute("data-edit-parents")) {
      showBreedingStep(root, "review");
      renderReview(root);
    }
  });

  function showBreedingStep(host: HTMLElement, step: string): void {
    for (const btn of host.querySelectorAll<HTMLElement>("[data-breeding-steps] .cl-step")) {
      btn.classList.toggle("is-active", btn.getAttribute("data-step") === step);
    }
    for (const prefix of ["stud", "dam", "review"]) {
      const panel = host.querySelector<HTMLElement>(`[data-parent="${prefix}"]`);
      if (panel) panel.hidden = prefix !== step;
    }
    const results = host.querySelector<HTMLElement>("[data-results]");
    if (results) results.hidden = step !== "results";
  }

  applyFullGenotype(root, "build", defaultGenotype(), assumedAll());
  applyFullGenotype(root, "stud", defaultGenotype(), assumedAll());
  applyFullGenotype(root, "dam", defaultGenotype(), assumedAll());
  lastBuild = defaultGenotype();
  lastParents.stud = defaultGenotype();
  lastParents.dam = defaultGenotype();
  refreshBuild();
  refreshSavedLists(root, loadDog);
  showBreedingStep(root, "stud");
}

initColorLab();
