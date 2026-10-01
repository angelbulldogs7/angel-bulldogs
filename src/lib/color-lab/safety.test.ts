import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { baselineDogState, presetState, withLocus } from "./dogState";
import { baselineGenotype } from "./genotype";
import { calculateLitter } from "./inheritance";
import { decideInterestSubmit, parseFormspreeEndpoint } from "./interestSubmit";
import { resolveDog, resolvePhenotype } from "./phenotypeResolver";
import { interestEligibility, pairingWarnings } from "./safetyRules";
import type { Genotype, LocusId } from "./types";
import { dogPreviewModel, phenotypeCardModel } from "./viewModels";

function dog(overrides: Partial<Record<LocusId, string>> = {}): Genotype {
  return { ...baselineGenotype(), ...overrides };
}

const LIVE = "https://formspree.io/f/abc123XYZ";

describe("interest eligibility", () => {
  it("offers no interest action for M/M", () => {
    const result = resolvePhenotype(dog({ k: "KB/KB", merle: "M/M" }));
    assert.deepEqual(interestEligibility(result), { eligible: false, reason: "double-merle" });
    const litter = calculateLitter(dog({ k: "KB/KB", merle: "M/m" }), dog({ k: "KB/KB", merle: "M/m" }));
    const concerning = litter.groups.find((group) => group.result.kind === "concerning");
    assert.ok(concerning);
    const card = phenotypeCardModel(concerning);
    assert.equal(card.eligibility.eligible, false);
    assert.equal(card.canPreviewBigRope, false);
    assert.equal(card.notices[0]?.code, "double-merle");
  });

  it("creates no card, image, or interest action for Dup/Dup", () => {
    const nonviable = resolvePhenotype(dog({ foxi3: "Dup/Dup" }));
    assert.equal(nonviable.kind, "nonviable");
    assert.deepEqual(interestEligibility(nonviable), { eligible: false, reason: "nonviable" });
    const litter = calculateLitter(dog({ foxi3: "N/Dup" }), dog({ foxi3: "N/Dup" }));
    assert.equal(litter.groups.length, 2);
    assert.ok(litter.groups.every((group) => group.result.kind === "viable"));
  });

  it("requires the Hairless acknowledgement before submitting N/Dup interest", () => {
    const state = presetState("fawn-hairless");
    assert.ok(state);
    const eligibility = interestEligibility(resolveDog(state));
    assert.deepEqual(eligibility, { eligible: true, acknowledgements: ["hairless"] });
    assert.deepEqual(decideInterestSubmit({ endpoint: LIVE, prototypeMode: false, eligibility, acknowledged: [] }), {
      action: "blocked",
      reason: "acknowledgement-required",
      missing: ["hairless"],
    });
    assert.deepEqual(
      decideInterestSubmit({ endpoint: LIVE, prototypeMode: false, eligibility, acknowledged: ["hairless"] }),
      { action: "submit", endpoint: LIVE },
    );
  });

  it("requires the Pink acknowledgement before submitting alb/alb interest", () => {
    const eligibility = interestEligibility(resolvePhenotype(dog({ slc45a2: "alb/alb", foxi3: "N/Dup" })));
    assert.deepEqual(eligibility, { eligible: true, acknowledgements: ["hairless", "pink"] });
    const decision = decideInterestSubmit({ endpoint: LIVE, prototypeMode: false, eligibility, acknowledged: ["hairless"] });
    assert.equal(decision.action, "blocked");
    if (decision.action === "blocked" && decision.reason === "acknowledgement-required") {
      assert.deepEqual(decision.missing, ["pink"]);
    }
  });

  it("never decides a successful send without real configuration", () => {
    const eligibility = interestEligibility(resolveDog(baselineDogState()));
    assert.deepEqual(decideInterestSubmit({ endpoint: null, prototypeMode: false, eligibility, acknowledged: [] }), {
      action: "unavailable",
      reason: "missing-endpoint",
    });
    assert.deepEqual(decideInterestSubmit({ endpoint: LIVE, prototypeMode: true, eligibility, acknowledged: [] }), {
      action: "unavailable",
      reason: "prototype-mode",
    });
    for (const fake of ["", "  ", "https://example.com/f/abc", "http://formspree.io/f/abc", "https://formspree.io/f/", "formspree", "https://formspree.io/f/abc?x=1"]) {
      assert.equal(parseFormspreeEndpoint(fake), null, fake);
    }
    assert.equal(parseFormspreeEndpoint(undefined), null);
    assert.equal(parseFormspreeEndpoint(` ${LIVE} `), LIVE);
  });
});

describe("pairing warnings", () => {
  it("warns before calculation when both parents can pass M or Dup", () => {
    assert.deepEqual(pairingWarnings(dog(), dog()), []);
    const codes = pairingWarnings(dog({ merle: "M/m", foxi3: "N/Dup" }), dog({ merle: "M/M", foxi3: "N/Dup" })).map(
      (warning) => warning.code,
    );
    assert.deepEqual(codes, ["merle-pairing", "hairless-pairing"]);
    assert.deepEqual(pairingWarnings(dog({ merle: "M/m" }), dog()), []);
  });
});

describe("result cards", () => {
  it("keeps carrier percentages off phenotype cards", () => {
    const litter = calculateLitter(dog({ dilute: "D/d", mitf: "N/S" }), dog({ dilute: "D/d", mitf: "N/S" }));
    for (const group of litter.groups) {
      const card = phenotypeCardModel(group);
      const rendered = JSON.stringify({ dnaRows: card.dnaRows, hidden: card.hidden, notices: card.notices });
      assert.doesNotMatch(rendered, /percent|%/i);
    }
    const dilute = litter.loci.find((item) => item.locus === "dilute");
    assert.equal(dilute?.rows.find((row) => row.status === "carrier")?.percent, "50.00");
  });

  it("previews Big Rope on viable cards without changing the probability", () => {
    const litter = calculateLitter(dog(), dog());
    const group = litter.groups[0];
    assert.ok(group);
    const card = phenotypeCardModel(group, true);
    assert.equal(card.result.publicName, "Fawn Solid Big Rope");
    assert.equal(card.percent, "100.00");
    assert.equal(card.result.recipe.bigRope, true);
  });

  it("builds a Build preview that keeps Masked out of the name but in DNA details", () => {
    const model = dogPreviewModel(withLocus(baselineDogState(), "dilute", "D/d"));
    assert.equal(model.result.publicName, "Fawn Solid");
    assert.deepEqual(model.carriers, ["Carries Dilute (D/d)"]);
    assert.ok(model.hidden.some((line) => line.includes("Eᴹ")));
    assert.equal(model.confirmation, "assumed");
  });
});
