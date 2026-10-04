import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PUPPY_INQUIRY_FORM_VERSION,
  PUPPY_INTEREST_FUTURE_LITTER,
  PUPPY_INTEREST_UNDECIDED,
  buildPuppyInquiryFormData,
  presentOptionalValue,
  resolvePuppyInterestFromQuery,
  validatePuppyInquiry,
} from "./puppyInquiry";

const SLUGS = ["hamilton", "aspy"] as const;

const valid = {
  fullName: "Alex Rivera",
  email: "alex@example.com",
  location: "Chicago, IL",
  puppyInterest: "hamilton",
  timing: "flexible",
  lookingFor: "family-companion",
  phone: "",
  message: "",
  inquiryAck: true,
};

describe("resolvePuppyInterestFromQuery", () => {
  it("preselects available puppies and general interests", () => {
    assert.deepEqual(resolvePuppyInterestFromQuery("hamilton", SLUGS), {
      value: "hamilton",
      unknown: false,
    });
    assert.deepEqual(resolvePuppyInterestFromQuery("FUTURE-LITTER", SLUGS), {
      value: PUPPY_INTEREST_FUTURE_LITTER,
      unknown: false,
    });
    assert.deepEqual(resolvePuppyInterestFromQuery(PUPPY_INTEREST_UNDECIDED, SLUGS), {
      value: PUPPY_INTEREST_UNDECIDED,
      unknown: false,
    });
  });

  it("falls back clearly for unknown or unavailable puppies", () => {
    assert.deepEqual(resolvePuppyInterestFromQuery("maple", SLUGS), {
      value: null,
      unknown: true,
    });
    assert.deepEqual(resolvePuppyInterestFromQuery("", SLUGS), { value: null, unknown: false });
    assert.deepEqual(resolvePuppyInterestFromQuery(null, SLUGS), { value: null, unknown: false });
  });
});

describe("validatePuppyInquiry", () => {
  it("accepts a short inquiry with blank optional phone and message", () => {
    const result = validatePuppyInquiry(valid, SLUGS);
    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, {});
  });

  it("accepts undecided and future-litter interests", () => {
    assert.equal(
      validatePuppyInquiry({ ...valid, puppyInterest: PUPPY_INTEREST_UNDECIDED }, SLUGS).ok,
      true,
    );
    assert.equal(
      validatePuppyInquiry({ ...valid, puppyInterest: PUPPY_INTEREST_FUTURE_LITTER }, SLUGS).ok,
      true,
    );
  });

  it("requires acknowledgement and core fields", () => {
    const result = validatePuppyInquiry({ ...valid, inquiryAck: false, fullName: "", email: "nope" }, SLUGS);
    assert.equal(result.ok, false);
    assert.equal(result.errors.inquiryAck, "Please confirm before sending.");
    assert.equal(result.errors.fullName, "This field is required.");
    assert.equal(result.errors.email, "Please enter a valid email.");
  });

  it("rejects removed long-application-only constraints by not requiring them", () => {
    // No household, ZIP, essays, sex, coat, or extra acknowledgements in the schema.
    assert.equal(validatePuppyInquiry(valid, SLUGS).ok, true);
  });
});

describe("buildPuppyInquiryFormData", () => {
  it("tags the payload version and presents blank optionals for the owner notice", () => {
    const body = buildPuppyInquiryFormData(valid);
    assert.equal(body.get("formVersion"), PUPPY_INQUIRY_FORM_VERSION);
    assert.equal(body.get("phone"), "Not provided");
    assert.equal(body.get("message"), "Not provided");
    assert.equal(body.get("puppyInterest"), "hamilton");
    assert.match(String(body.get("_subject")), /^Puppy Inquiry:/);
  });

  it("keeps typed optional values", () => {
    assert.equal(presentOptionalValue("  555-0100  "), "555-0100");
    const body = buildPuppyInquiryFormData({
      ...valid,
      phone: "555-0100",
      message: "Prefer Chicago pickup",
    });
    assert.equal(body.get("phone"), "555-0100");
    assert.equal(body.get("message"), "Prefer Chicago pickup");
  });
});
