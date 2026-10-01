import { COLOR_LAB_STORAGE_KEY } from "./types";
import type { DogRecord, KeyValueStore } from "./types";
import { parseDogRecordList } from "./validation";

export function memoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = value;
    },
    removeItem(key) {
      delete data[key];
    },
  };
}

export function loadSavedDogs(store: KeyValueStore): DogRecord[] {
  const raw = store.getItem(COLOR_LAB_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return parseDogRecordList(parsed);
  } catch {
    return [];
  }
}

export function writeSavedDogs(store: KeyValueStore, dogs: DogRecord[]): void {
  store.setItem(COLOR_LAB_STORAGE_KEY, JSON.stringify(dogs));
}

export function upsertSavedDog(store: KeyValueStore, dog: DogRecord): DogRecord[] {
  const dogs = loadSavedDogs(store);
  const index = dogs.findIndex((item) => item.id === dog.id);
  if (index === -1) dogs.push(dog);
  else dogs[index] = dog;
  writeSavedDogs(store, dogs);
  return dogs;
}

export function deleteSavedDog(store: KeyValueStore, id: string): DogRecord[] {
  const dogs = loadSavedDogs(store).filter((item) => item.id !== id);
  writeSavedDogs(store, dogs);
  return dogs;
}

export function renameSavedDog(store: KeyValueStore, id: string, name: string): DogRecord[] {
  const dogs = loadSavedDogs(store).map((item) =>
    item.id === id ? { ...item, name, updatedAt: new Date().toISOString() } : item,
  );
  writeSavedDogs(store, dogs);
  return dogs;
}
