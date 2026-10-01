import { buildSavedDog, migrateSavedDog, type MigrationReport } from "./migrations";
import type { DogSex, DogState, KeyValueStore, SavedDog } from "./types";
import { COLOR_LAB_LEGACY_STORAGE_KEY, COLOR_LAB_STORAGE_KEY } from "./types";
import { sanitizeDogName } from "./validation";

export function memoryStore(initial: Record<string, string> = {}): KeyValueStore & {
  readonly data: Record<string, string>;
} {
  const data: Record<string, string> = { ...initial };
  return {
    data,
    getItem(key) {
      return Object.hasOwn(data, key) ? (data[key] ?? null) : null;
    },
    setItem(key, value) {
      data[key] = value;
    },
    removeItem(key) {
      delete data[key];
    },
  };
}

function safeGet(store: KeyValueStore, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export function writeSavedDogs(store: KeyValueStore, dogs: readonly SavedDog[]): boolean {
  try {
    store.setItem(COLOR_LAB_STORAGE_KEY, JSON.stringify(dogs));
    return true;
  } catch {
    return false;
  }
}

function parseJsonArray(raw: string): unknown[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export interface LoadResult {
  readonly dogs: SavedDog[];
  readonly reports: MigrationReport[];
  readonly dropped: number;
  readonly source: "current" | "legacy" | "empty";
}

function needsRewrite(report: MigrationReport): boolean {
  return (
    report.sourceVersion !== 2 ||
    report.discardedFields.length > 0 ||
    report.confirmationBefore !== report.confirmationAfter ||
    Object.values(report.loci).some((outcome) => outcome !== "exact")
  );
}

function migrateList(items: readonly unknown[], now: string): Omit<LoadResult, "source"> {
  const dogs: SavedDog[] = [];
  const reports: MigrationReport[] = [];
  const seen = new Set<string>();
  let dropped = 0;
  for (const item of items) {
    const migrated = migrateSavedDog(item, now);
    if (!migrated || seen.has(migrated.dog.id)) {
      dropped += 1;
      continue;
    }
    seen.add(migrated.dog.id);
    dogs.push(migrated.dog);
    reports.push(migrated.report);
  }
  return { dogs, reports, dropped };
}

/**
 * Loads saved dogs, migrating legacy v1 storage once. Corrupt JSON or records never throw;
 * invalid entries are skipped and valid ones are kept.
 */
export function loadSavedDogs(store: KeyValueStore, now: string = new Date().toISOString()): LoadResult {
  const current = safeGet(store, COLOR_LAB_STORAGE_KEY);
  if (current !== null) {
    const items = parseJsonArray(current);
    if (!items) return { dogs: [], reports: [], dropped: 0, source: "current" };
    const result = migrateList(items, now);
    if (result.dropped > 0 || result.reports.some(needsRewrite)) writeSavedDogs(store, result.dogs);
    return { ...result, source: "current" };
  }

  const legacy = safeGet(store, COLOR_LAB_LEGACY_STORAGE_KEY);
  if (legacy !== null) {
    const items = parseJsonArray(legacy);
    if (!items) return { dogs: [], reports: [], dropped: 0, source: "legacy" };
    const result = migrateList(items, now);
    if (writeSavedDogs(store, result.dogs)) {
      try {
        store.removeItem(COLOR_LAB_LEGACY_STORAGE_KEY);
      } catch {
        // The migrated copy is already written; a stale legacy key is harmless.
      }
    }
    return { ...result, source: "legacy" };
  }

  return { dogs: [], reports: [], dropped: 0, source: "empty" };
}

export function createSavedDog(input: {
  readonly id: string;
  readonly name: string;
  readonly sex: DogSex;
  readonly state: DogState;
  readonly now: string;
}): SavedDog | null {
  const name = sanitizeDogName(input.name);
  if (!name) return null;
  return buildSavedDog({
    id: input.id,
    name,
    sex: input.sex,
    genotype: input.state.genotype,
    bigRope: input.state.bigRope,
    confirmation: input.state.confirmation,
    createdAt: input.now,
    updatedAt: input.now,
  });
}

export function upsertSavedDog(store: KeyValueStore, dog: SavedDog): SavedDog[] | null {
  const dogs = loadSavedDogs(store).dogs;
  const index = dogs.findIndex((item) => item.id === dog.id);
  if (index === -1) dogs.push(dog);
  else dogs[index] = dog;
  return writeSavedDogs(store, dogs) ? dogs : null;
}

export function deleteSavedDog(store: KeyValueStore, id: string): SavedDog[] | null {
  const dogs = loadSavedDogs(store).dogs.filter((item) => item.id !== id);
  return writeSavedDogs(store, dogs) ? dogs : null;
}

export function savedDogState(dog: SavedDog): DogState {
  return { genotype: dog.genotype, bigRope: dog.bigRope, confirmation: dog.confirmation };
}
