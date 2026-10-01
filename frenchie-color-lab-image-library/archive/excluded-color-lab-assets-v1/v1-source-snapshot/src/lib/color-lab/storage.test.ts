import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyPreset, COLOR_PRESETS, getPreset } from "../../data/color-lab/presets";
import { LOCUS_IDS } from "../../data/color-lab/loci";
import { defaultGenotype, genotypesEqual } from "./genotype";
import { loadRequiresSexConfirm } from "./parents";
import { resolvePhenotype } from "./phenotypeResolver";
import { COLOR_LAB_RULESET_VERSION, COLOR_LAB_SCHEMA_VERSION, type DogRecord } from "./types";
import { deleteSavedDog, loadSavedDogs, memoryStore, upsertSavedDog } from "./storage";
import { buildInterestPayload } from "./interestPayload";
import { decideInterestSubmit } from "./interestSubmit";
import { assumedProvenance, cloneGenotype } from "./genotype";

describe("presets", () => {
  it("applies a complete genotype and clears previous loci", () => {
    const black = applyPreset("black");
    const cream = applyPreset("cream");
    assert.ok(black && cream);
    assert.equal(black.k[0], "KB");
    assert.equal(cream.k[0], "ky");
    assert.equal(cream.mc1r[0], "e");
    assert.equal(LOCUS_IDS.every((id) => cream[id] && cream[id].length === 2), true);
  });

  it("classic fawn matches the explicit default genotype", () => {
    const preset = getPreset("classic-fawn");
    assert.ok(preset);
    assert.ok(genotypesEqual(preset.genotype, defaultGenotype()));
  });

  it("includes compositional starter presets", () => {
    const ids = COLOR_PRESETS.map((item) => item.id);
    for (const id of ["classic-fawn", "brindle", "cream", "lilac", "isabella", "rojo", "pink", "hairless-fawn"]) {
      assert.ok(ids.includes(id), `missing ${id}`);
    }
  });
});

describe("storage", () => {
  it("round-trips a saved dog", () => {
    const store = memoryStore();
    const genotype = defaultGenotype();
    const phenotype = resolvePhenotype(genotype);
    const dog: DogRecord = {
      schemaVersion: COLOR_LAB_SCHEMA_VERSION,
      rulesetVersion: COLOR_LAB_RULESET_VERSION,
      id: "dog-1",
      name: "Maple",
      sex: "female",
      genotype,
      provenance: assumedProvenance(),
      phenotypeSlug: phenotype.slug,
      imageId: phenotype.imageId,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    };
    upsertSavedDog(store, dog);
    const loaded = loadSavedDogs(store);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].name, "Maple");
    assert.equal(loaded[0].sex, "female");
    assert.ok(genotypesEqual(loaded[0].genotype, genotype));
    assert.equal(loaded[0].provenance.asip, "assumed");
  });

  it("fails safely on corrupt localStorage", () => {
    const store = memoryStore({ "angel-bulldogs.color-lab.v1": "{not-json" });
    assert.deepEqual(loadSavedDogs(store), []);
  });

  it("ignores old schema versions", () => {
    const store = memoryStore({
      "angel-bulldogs.color-lab.v1": JSON.stringify([{ schemaVersion: 0, name: "Old" }]),
    });
    assert.deepEqual(loadSavedDogs(store), []);
  });

  it("deletes by id", () => {
    const store = memoryStore();
    const genotype = defaultGenotype();
    const phenotype = resolvePhenotype(genotype);
    upsertSavedDog(store, {
      schemaVersion: COLOR_LAB_SCHEMA_VERSION,
      rulesetVersion: COLOR_LAB_RULESET_VERSION,
      id: "dog-1",
      name: "A",
      sex: "male",
      genotype,
      provenance: assumedProvenance(),
      phenotypeSlug: phenotype.slug,
      imageId: phenotype.imageId,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    });
    deleteSavedDog(store, "dog-1");
    assert.equal(loadSavedDogs(store).length, 0);
  });
});

describe("parent sex loading", () => {
  it("does not treat opposite-sex loads as silent matches", () => {
    assert.equal(loadRequiresSexConfirm("female", "stud"), true);
    assert.equal(loadRequiresSexConfirm("male", "dam"), true);
    assert.equal(loadRequiresSexConfirm("male", "stud"), false);
    assert.equal(loadRequiresSexConfirm("female", "dam"), false);
  });
});

describe("interest payload and submit boundary", () => {
  it("includes puppy, provenance, and parent context", () => {
    const genotype = cloneGenotype(defaultGenotype());
    const phenotype = resolvePhenotype(genotype);
    const payload = buildInterestPayload({
      source: "breeding",
      visitor: {
        fullName: "Jordan Lee",
        email: "jordan@example.com",
        phone: "3125550100",
        city: "Chicago",
        state: "IL",
        timeframe: "3-6 months",
      },
      phenotype,
      genotype,
      provenance: assumedProvenance(),
      probability: "37.50",
      stud: {
        name: "Otto",
        sex: "male",
        genotype,
        provenance: assumedProvenance(),
        phenotypeSlug: phenotype.slug,
        phenotypeName: phenotype.commonName,
      },
      dam: {
        name: "Bella",
        sex: "female",
        genotype,
        provenance: assumedProvenance(),
        phenotypeSlug: phenotype.slug,
        phenotypeName: phenotype.commonName,
      },
      now: new Date("2026-09-01T12:00:00.000Z"),
    });
    assert.equal(payload.puppy.commonName, phenotype.commonName);
    assert.equal(payload.puppy.probability, "37.50");
    assert.equal(payload.stud?.name, "Otto");
    assert.equal(payload.dam?.name, "Bella");
    assert.equal(payload.rulesetVersion, COLOR_LAB_RULESET_VERSION);
    assert.ok(payload.puppy.genotype.asip);
  });

  it("missing endpoint never decides a successful send", () => {
    const missing = decideInterestSubmit({ endpoint: "", prototypeMode: false });
    const proto = decideInterestSubmit({ endpoint: "https://formspree.io/f/example", prototypeMode: true });
    const live = decideInterestSubmit({ endpoint: "https://formspree.io/f/example", prototypeMode: false });
    assert.equal(missing.action, "unavailable");
    if (missing.action === "unavailable") assert.equal(missing.reason, "missing-endpoint");
    assert.equal(proto.action, "unavailable");
    assert.equal(live.action, "submit");
  });
});
