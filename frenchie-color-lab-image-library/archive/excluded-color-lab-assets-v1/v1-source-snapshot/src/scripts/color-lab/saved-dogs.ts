import { COLOR_LAB_RULESET_VERSION, COLOR_LAB_SCHEMA_VERSION, type DogRecord, type DogSex } from "../../lib/color-lab/types";
import { sanitizeDogName } from "../../lib/color-lab/validation";
import { deleteSavedDog, loadSavedDogs, renameSavedDog, upsertSavedDog } from "../../lib/color-lab/storage";
import type { Genotype, ProvenanceMap } from "../../lib/color-lab/types";
import { resolvePhenotype } from "../../lib/color-lab/phenotypeResolver";

function browserStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function currentSavedDogs(): DogRecord[] {
  const store = browserStore();
  return store ? loadSavedDogs(store) : [];
}

export function persistDog(input: {
  id?: string;
  name: string;
  sex: DogSex;
  genotype: Genotype;
  provenance: ProvenanceMap;
}): DogRecord | null {
  const store = browserStore();
  if (!store) return null;
  const name = sanitizeDogName(input.name);
  if (!name) return null;
  const phenotype = resolvePhenotype(input.genotype, input.provenance);
  const now = new Date().toISOString();
  const existingId = input.id;
  const record: DogRecord = {
    schemaVersion: COLOR_LAB_SCHEMA_VERSION,
    rulesetVersion: COLOR_LAB_RULESET_VERSION,
    id: existingId ?? `dog-${crypto.randomUUID()}`,
    name,
    sex: input.sex,
    genotype: input.genotype,
    provenance: input.provenance,
    phenotypeSlug: phenotype.slug,
    imageId: phenotype.imageId,
    createdAt: existingId
      ? (currentSavedDogs().find((item) => item.id === existingId)?.createdAt ?? now)
      : now,
    updatedAt: now,
  };
  upsertSavedDog(store, record);
  return record;
}

export function removeDog(id: string): void {
  const store = browserStore();
  if (store) deleteSavedDog(store, id);
}

export function renameDog(id: string, name: string): void {
  const store = browserStore();
  if (store) renameSavedDog(store, id, sanitizeDogName(name));
}

export function renderSavedList(
  list: HTMLElement,
  onLoad: (id: string) => void,
  onDelete: (id: string) => void,
): void {
  list.replaceChildren();
  const dogs = currentSavedDogs();
  if (dogs.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No dogs saved in this browser yet.";
    list.append(li);
    return;
  }
  for (const dog of dogs) {
    const li = document.createElement("li");
    li.className = "cl-saved__item";
    const label = document.createElement("p");
    label.textContent = `${dog.name} · ${dog.sex === "female" ? "Female" : "Male"} · ${dog.phenotypeSlug}`;
    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.className = "btn btn--ghost";
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", () => onLoad(dog.id));
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn--ghost";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => onDelete(dog.id));
    li.append(label, loadBtn, deleteBtn);
    list.append(li);
  }
}
