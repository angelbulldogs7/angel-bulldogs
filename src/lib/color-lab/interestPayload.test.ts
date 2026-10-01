import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { baselineDogState, presetState, withBigRope, withConfirmation, withLocus } from "./dogState";
import { calculateLitter } from "./inheritance";
import { buildInterestPayload, formatInterestSummary, toFormspreeBody, type InterestVisitor } from "./interestPayload";
import { resolveDog, resolveProfile } from "./phenotypeResolver";
import type { VisiblePhenotype } from "./types";
import { COLOR_LAB_RULESET_VERSION } from "./types";

const VISITOR: InterestVisitor = {
  fullName: "Jordan Lee",
  email: "jordan@example.com",
  phone: "3125550100",
  city: "Chicago",
  state: "IL",
  timeframe: "3-6 months",
};
const NOW = new Date("2026-09-23T12:00:00.000Z");

function viable(result: ReturnType<typeof resolveDog>): VisiblePhenotype & { kind: "viable" } {
  if (result.kind !== "viable") throw new Error("Expected a viable phenotype.");
  return result;
}

describe("interest payload", () => {
  it("sends the full Build a Frenchie context", () => {
    const state = withConfirmation(withBigRope(withLocus(baselineDogState(), "dilute", "D/d"), true), "lab-confirmed");
    const payload = buildInterestPayload({ source: "build", state, result: viable(resolveDog(state)) }, VISITOR, [], NOW);
    assert.equal(payload.source, "build");
    assert.equal(payload.rulesetVersion, COLOR_LAB_RULESET_VERSION);
    assert.equal(payload.schemaVersion, 2);
    assert.equal(payload.puppy.publicName, "Fawn Solid Big Rope");
    assert.match(payload.puppy.visualId, /^clv2-/);
    assert.equal(payload.puppy.confirmation, "lab-confirmed");
    assert.equal(payload.puppy.probability, null);
    assert.deepEqual(payload.puppy.bigRope, {
      selected: true,
      basis: "visual preference",
      geneticChance: "Unknown — not genetically calculated",
    });
    assert.equal(payload.puppy.genotype.kind, "selected");
    if (payload.puppy.genotype.kind === "selected") {
      assert.equal(payload.puppy.genotype.loci.dilute.display, "D/d");
      assert.equal(payload.puppy.genotype.loci.asip.display, "Aᴰʸ/Aᴰʸ");
    }
    assert.ok(payload.puppy.hiddenDna.includes("Carries Dilute (D/d)"));
    assert.equal(payload.stud, null);
  });

  it("sends probability, denominator, parents, and acknowledgements from breeding", () => {
    const stud = withBigRope(withLocus(baselineDogState(), "foxi3", "N/Dup"), true);
    const dam = withLocus(baselineDogState(), "foxi3", "N/Dup");
    const litter = calculateLitter(stud.genotype, dam.genotype);
    const group = litter.groups.find((item) => item.result.tokens.hairless);
    assert.ok(group);
    const previewed = viable(resolveProfile(group.result.profile, { bigRope: true }));
    const payload = buildInterestPayload(
      {
        source: "breeding",
        group,
        result: previewed,
        bigRopePreview: true,
        stud: { name: "Otto", sex: "male", state: stud },
        dam: { name: "Bella", sex: "female", state: dam },
        nonviablePercent: litter.nonviable?.percent ?? null,
      },
      VISITOR,
      ["hairless"],
      NOW,
    );
    assert.equal(payload.puppy.publicName, "Hairless Fawn Solid Big Rope");
    assert.equal(payload.puppy.confirmation, "calculated");
    assert.deepEqual(payload.puppy.probability, {
      perConception: "50.00",
      exact: "1/2",
      denominator: "All conceptions from this pairing, including any nonviable FOXI3 Dup/Dup conceptions",
      viableOnly: {
        percent: "66.67",
        denominator: "Potentially viable conceptions only (excludes 25.00% FOXI3 Dup/Dup)",
      },
    });
    assert.equal(payload.puppy.bigRope.basis, "manual preview");
    assert.deepEqual(payload.puppy.acknowledgements, { hairless: true, pink: false });
    assert.equal(payload.stud?.name, "Otto");
    assert.equal(payload.stud?.bigRope, true);
    assert.equal(payload.stud?.publicName, "Hairless Fawn Solid Big Rope");
    assert.equal(payload.dam?.sex, "female");
    assert.equal(payload.dam?.confirmation, "assumed");
    assert.equal(payload.puppy.genotype.kind, "calculated");
    if (payload.puppy.genotype.kind === "calculated") {
      assert.deepEqual(
        payload.puppy.genotype.loci.foxi3.map((item) => [item.display, item.withinPhenotype]),
        [["N/Dup", "100.00"]],
      );
    }
  });

  it("formats a readable summary and flat Formspree fields", () => {
    const state = presetState("pink");
    assert.ok(state);
    const payload = buildInterestPayload({ source: "build", state, result: viable(resolveDog(state)) }, VISITOR, ["pink"], NOW);
    const summary = formatInterestSummary(payload);
    assert.match(summary, /Phenotype: Pink Solid/);
    assert.match(summary, /pink=yes/);
    const body = toFormspreeBody(payload);
    assert.equal(body.email, VISITOR.email);
    assert.equal(body._subject, "Color Lab interest: Pink Solid");
    assert.deepEqual(JSON.parse(body.payload ?? "{}").puppy.publicName, "Pink Solid");
  });
});
