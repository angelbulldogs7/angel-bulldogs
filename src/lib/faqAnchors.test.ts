import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAllFaqs } from "../data/faqs";
import { matchFaqId, parseFaqFragmentId } from "./faqAnchors";

const knownIds = getAllFaqs().map((item) => item.id);

describe("parseFaqFragmentId", () => {
  it("accepts valid FAQ-style ids with or without a hash", () => {
    assert.equal(parseFaqFragmentId("#records"), "records");
    assert.equal(parseFaqFragmentId("agree-hold"), "agree-hold");
    assert.equal(parseFaqFragmentId("#dna-traits"), "dna-traits");
  });

  it("rejects empty, malformed, or unsafe fragments", () => {
    assert.equal(parseFaqFragmentId(""), null);
    assert.equal(parseFaqFragmentId("#"), null);
    assert.equal(parseFaqFragmentId(null), null);
    assert.equal(parseFaqFragmentId(undefined), null);
    assert.equal(parseFaqFragmentId("#records .open"), null);
    assert.equal(parseFaqFragmentId("#records>summary"), null);
    assert.equal(parseFaqFragmentId("#../../etc"), null);
    assert.equal(parseFaqFragmentId("#records%20"), null);
  });

  it("decodes a single valid percent-encoded id", () => {
    assert.equal(parseFaqFragmentId("#agree%2Dhold"), "agree-hold");
  });
});

describe("matchFaqId", () => {
  it("matches only known FAQ ids from site data", () => {
    assert.equal(matchFaqId("records", knownIds), "records");
    assert.equal(matchFaqId("agree-hold", knownIds), "agree-hold");
    assert.equal(matchFaqId("not-a-real-faq", knownIds), null);
    assert.ok(knownIds.includes("records"));
    assert.ok(knownIds.includes("agree-hold"));
    assert.equal(knownIds.length, 8);
  });
});
