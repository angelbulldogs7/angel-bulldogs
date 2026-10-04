import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decideFormDelivery, parseBrevoFormEndpoint, parseFormspreeEndpoint } from "./formDelivery";

const FORMSPREE = "https://formspree.io/f/abc123XYZ";
const BREVO = "https://xxxyyyzzz.sibforms.com/serve/MUIFA_example_token_here";

describe("parseFormspreeEndpoint", () => {
  it("accepts real Formspree URLs and rejects everything else", () => {
    assert.equal(parseFormspreeEndpoint(FORMSPREE), FORMSPREE);
    assert.equal(parseFormspreeEndpoint(` ${FORMSPREE} `), FORMSPREE);
    for (const fake of ["", "https://example.com/f/abc", "http://formspree.io/f/abc", "https://formspree.io/f/"]) {
      assert.equal(parseFormspreeEndpoint(fake), null, fake);
    }
  });
});

describe("parseBrevoFormEndpoint", () => {
  it("accepts sibforms serve URLs", () => {
    assert.equal(parseBrevoFormEndpoint(BREVO), BREVO);
    assert.equal(parseBrevoFormEndpoint("https://sibforms.com/serve/MUIFAabc"), "https://sibforms.com/serve/MUIFAabc");
    assert.equal(parseBrevoFormEndpoint("https://evil.com/serve/x"), null);
    assert.equal(parseBrevoFormEndpoint(""), null);
  });
});

describe("decideFormDelivery", () => {
  it("blocks prototype mode and missing endpoints", () => {
    assert.deepEqual(decideFormDelivery({ endpoint: FORMSPREE, prototypeMode: true }), {
      action: "unavailable",
      reason: "prototype-mode",
    });
    assert.deepEqual(decideFormDelivery({ endpoint: null, prototypeMode: false }), {
      action: "unavailable",
      reason: "missing-endpoint",
    });
    assert.deepEqual(decideFormDelivery({ endpoint: FORMSPREE, prototypeMode: false }), {
      action: "submit",
      endpoint: FORMSPREE,
    });
  });
});
