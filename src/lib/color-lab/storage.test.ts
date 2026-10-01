import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { baselineDogState, withBigRope, withConfirmation, withLocus } from "./dogState";
import { baselineGenotype } from "./genotype";
import { migrateSavedDog } from "./migrations";
import { loadRequiresSexConfirm } from "./parents";
import {
  createSavedDog,
  deleteSavedDog,
  loadSavedDogs,
  memoryStore,
  savedDogState,
  upsertSavedDog,
} from "./storage";
import { COLOR_LAB_LEGACY_STORAGE_KEY, COLOR_LAB_STORAGE_KEY } from "./types";

const NOW = "2026-09-23T12:00:00.000Z";

/** A complete v1 record exactly as the previous Color Lab saved it. */
function v1Record(overrides: Record<string, unknown> = {}, genotype: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    rulesetVersion: "1.0.0",
    id: "dog-v1",
    name: "Maple",
    sex: "female",
    genotype: {
      asip: ["dy", "dy"],
      tyrp1: ["B", "B"],
      cocoa: ["Co", "Co"],
      dilute: ["D", "D"],
      k: ["ky", "ky"],
      mc1r: ["Em", "Em"],
      mitf: ["N", "N"],
      merle: ["m", "m"],
      intensity: ["I", "I"],
      slc45a2: ["C", "C"],
      fgf5: ["N", "N"],
      foxi3: ["N", "N"],
      krt71: ["N", "N"],
      rspo2: ["ic", "ic"],
      ...genotype,
    },
    provenance: { asip: "confirmed", tyrp1: "assumed" },
    phenotypeSlug: "fawn",
    imageId: "fawn",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("saved dogs", () => {
  it("round-trips name, sex, complete DNA, Big Rope, and confirmation", () => {
    const store = memoryStore();
    let state = withLocus(baselineDogState(), "dilute", "D/d");
    state = withConfirmation(withBigRope(state, true), "lab-confirmed");
    const dog = createSavedDog({ id: "dog-1", name: "  Otto  ", sex: "male", state, now: NOW });
    assert.ok(dog);
    upsertSavedDog(store, dog);
    const loaded = loadSavedDogs(store, NOW);
    assert.equal(loaded.dogs.length, 1);
    const saved = loaded.dogs[0];
    assert.ok(saved);
    assert.equal(saved.name, "Otto");
    assert.equal(saved.sex, "male");
    assert.deepEqual(savedDogState(saved), state);
    assert.equal(saved.phenotype.publicName, "Fawn Solid Big Rope");
    assert.equal(saved.schemaVersion, 2);
    assert.match(saved.phenotype.visualId, /^clv2-[0-9a-f]{8}$/);
  });

  it("rejects an empty name and deletes by id", () => {
    assert.equal(createSavedDog({ id: "x", name: "   ", sex: "female", state: baselineDogState(), now: NOW }), null);
    const store = memoryStore();
    const dog = createSavedDog({ id: "dog-1", name: "Bella", sex: "female", state: baselineDogState(), now: NOW });
    assert.ok(dog);
    upsertSavedDog(store, dog);
    deleteSavedDog(store, "dog-1");
    assert.equal(loadSavedDogs(store, NOW).dogs.length, 0);
  });

  it("does not silently relabel an opposite-sex dog loaded as Stud or Dam", () => {
    assert.equal(loadRequiresSexConfirm("female", "stud"), true);
    assert.equal(loadRequiresSexConfirm("male", "dam"), true);
    assert.equal(loadRequiresSexConfirm("male", "stud"), false);
  });
});

describe("v1 migration", () => {
  it("keeps supported DNA and silently discards removed fields", () => {
    const record = v1Record({ eyes: "blue", shadeLevel: "red", brindleDensity: "heavy", mode: "advanced" });
    const migrated = migrateSavedDog(record, NOW);
    assert.ok(migrated);
    assert.deepEqual(migrated.dog.genotype, { ...baselineGenotype(), mc1r: "Em/Em" });
    assert.equal(migrated.dog.name, "Maple");
    assert.equal(migrated.dog.createdAt, "2026-09-01T00:00:00.000Z");
    assert.equal(migrated.dog.bigRope, false);
    for (const field of [
      "provenance",
      "phenotypeSlug",
      "imageId",
      "eyes",
      "shadeLevel",
      "brindleDensity",
      "mode",
      "genotype.krt71",
      "genotype.rspo2",
    ]) {
      assert.ok(migrated.report.discardedFields.includes(field), field);
    }
    assert.equal("krt71" in migrated.dog.genotype, false);
    assert.equal("rspo2" in migrated.dog.genotype, false);
  });

  it("normalizes old Dilute, FGF5, Brown, Pink, Intensity, and Agouti states with dosage intact", () => {
    const migrated = migrateSavedDog(
      v1Record(
        {},
        {
          dilute: ["d1", "d3"],
          fgf5: ["N", "L4"],
          tyrp1: ["bs", "bd"],
          slc45a2: ["C", "ca"],
          intensity: ["i", "i"],
          asip: ["bs", "a"],
        },
      ),
      NOW,
    );
    assert.ok(migrated);
    const g = migrated.dog.genotype;
    assert.equal(g.dilute, "d/d");
    assert.equal(g.fgf5, "L/l");
    assert.equal(g.tyrp1, "b/b");
    assert.equal(g.slc45a2, "N/alb");
    assert.equal(g.intensity, "In/In");
    assert.equal(g.asip, "abb/a");
    assert.equal(migrated.report.loci.dilute, "collapsed");
    assert.equal(migrated.report.loci.slc45a2, "exact");
    assert.equal(migrated.report.loci.asip, "collapsed");
    assert.equal(migrated.dog.confirmation, "assumed");
  });

  it("maps defensible old Agouti states and keeps sy/dy exact", () => {
    const sable = migrateSavedDog(v1Record({}, { asip: ["dy", "sy"] }), NOW);
    assert.equal(sable?.dog.genotype.asip, "ady/asy");
    assert.equal(sable?.report.loci.asip, "exact");
  });

  it("falls back to baseline for unmappable values instead of inventing DNA", () => {
    const migrated = migrateSavedDog(
      v1Record({}, { dilute: ["D", "zz"], foxi3: ["Dup", "Dup"], asip: ["aw", "a"], k: "garbage" }),
      NOW,
    );
    assert.ok(migrated);
    assert.equal(migrated.dog.genotype.dilute, "D/D");
    assert.equal(migrated.dog.genotype.foxi3, "N/N");
    assert.equal(migrated.dog.genotype.asip, "ady/ady");
    assert.equal(migrated.dog.genotype.k, "ky/ky");
    for (const locus of ["dilute", "foxi3", "asip", "k"] as const) {
      assert.equal(migrated.report.loci[locus], "fallback", locus);
    }
    assert.equal(migrated.dog.confirmation, "assumed");
  });

  it("never treats v1 user-entered flags as a laboratory report", () => {
    const allConfirmed = Object.fromEntries(
      ["asip", "tyrp1", "cocoa", "dilute", "k", "mc1r", "mitf", "merle", "intensity", "slc45a2", "fgf5", "foxi3"].map(
        (locus) => [locus, "confirmed"],
      ),
    );
    const migrated = migrateSavedDog(v1Record({ provenance: allConfirmed }), NOW);
    assert.equal(migrated?.report.confirmationBefore, "none");
    assert.equal(migrated?.dog.confirmation, "assumed");
  });

  it("migrates legacy storage once, then reads only the new key", () => {
    const store = memoryStore({
      [COLOR_LAB_LEGACY_STORAGE_KEY]: JSON.stringify([
        v1Record(),
        v1Record({ id: "dog-2", name: "Juniper", sex: "male" }, { dilute: ["D", "d2"] }),
        { schemaVersion: 1, name: "Broken" },
        "not a dog",
      ]),
    });
    const loaded = loadSavedDogs(store, NOW);
    assert.equal(loaded.source, "legacy");
    assert.equal(loaded.dogs.length, 2);
    assert.equal(loaded.dropped, 2);
    assert.equal(loaded.dogs[1]?.genotype.dilute, "D/d");
    assert.equal(store.getItem(COLOR_LAB_LEGACY_STORAGE_KEY), null);
    assert.ok(store.getItem(COLOR_LAB_STORAGE_KEY));
    const again = loadSavedDogs(store, NOW);
    assert.equal(again.source, "current");
    assert.equal(again.dogs.length, 2);
    assert.equal(again.reports.every((report) => report.sourceVersion === 2), true);
  });
});

describe("current-schema validation", () => {
  function v2(overrides: Record<string, unknown> = {}) {
    const dog = createSavedDog({
      id: "dog-lab",
      name: "Lab Dog",
      sex: "female",
      state: withConfirmation(baselineDogState(), "lab-confirmed"),
      now: NOW,
    });
    return { ...dog, ...overrides };
  }

  it("preserves Lab-confirmed when every locus maps exactly", () => {
    const migrated = migrateSavedDog(v2(), NOW);
    assert.equal(migrated?.dog.confirmation, "lab-confirmed");
  });

  it("clears Lab-confirmed after any collapse or fallback", () => {
    const collapsed = migrateSavedDog(v2({ genotype: { ...baselineGenotype(), dilute: "D/d2" } }), NOW);
    assert.equal(collapsed?.dog.genotype.dilute, "D/d");
    assert.equal(collapsed?.dog.confirmation, "assumed");
    const fallback = migrateSavedDog(v2({ genotype: { ...baselineGenotype(), merle: "M/Q" } }), NOW);
    assert.equal(fallback?.dog.genotype.merle, "m/m");
    assert.equal(fallback?.dog.confirmation, "assumed");
  });

  it("fails safely on corrupt storage", () => {
    for (const raw of ["{not-json", "42", '{"a":1}', "null"]) {
      const store = memoryStore({ [COLOR_LAB_STORAGE_KEY]: raw });
      assert.deepEqual(loadSavedDogs(store, NOW).dogs, [], raw);
    }
    const throwing = {
      getItem(): string | null {
        throw new Error("blocked");
      },
      setItem(): void {
        throw new Error("blocked");
      },
      removeItem(): void {
        throw new Error("blocked");
      },
    };
    assert.deepEqual(loadSavedDogs(throwing, NOW).dogs, []);
  });

  it("recovers valid records from a partly corrupt list", () => {
    const good = v2();
    const store = memoryStore({
      [COLOR_LAB_STORAGE_KEY]: JSON.stringify([good, null, { ...good, id: "dup" }, { ...good }, { ...good, id: "", name: "" }]),
    });
    const loaded = loadSavedDogs(store, NOW);
    assert.deepEqual(
      loaded.dogs.map((dog) => dog.id),
      ["dog-lab", "dup"],
    );
    assert.equal(loaded.dropped, 3);
  });
});
