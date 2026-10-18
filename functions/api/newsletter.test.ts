import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { configReady, onRequest, parseListIds } from "./newsletter.ts";

const baseEnv = {
  BREVO_API_KEY: "test-key",
  BREVO_NEWSLETTER_LIST_IDS: "12,34",
  BREVO_NEWSLETTER_MODE: "doi",
  BREVO_DOI_TEMPLATE_ID: "99",
  BREVO_DOI_REDIRECT_URL: "https://angelbulldogs.com/newsletter/thanks/",
};

describe("newsletter config", () => {
  it("parses comma-separated list IDs", () => {
    assert.deepEqual(parseListIds("12, 34"), [12, 34]);
    assert.deepEqual(parseListIds(""), []);
  });

  it("requires doi mode and complete DOI bindings", () => {
    assert.equal(configReady(baseEnv).ok, true);
    assert.equal(configReady({ ...baseEnv, BREVO_NEWSLETTER_MODE: "direct" }).ok, false);
    assert.equal(configReady({ ...baseEnv, BREVO_API_KEY: "" }).ok, false);
    assert.equal(configReady({ ...baseEnv, BREVO_DOI_TEMPLATE_ID: "" }).ok, false);
    assert.equal(
      configReady({ ...baseEnv, BREVO_DOI_REDIRECT_URL: "http://insecure.example/" }).ok,
      false,
    );
  });
});

describe("newsletter handler", () => {
  it("returns unavailable without calling upstream when unconfigured", async () => {
    let called = false;
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      called = true;
      return new Response("{}", { status: 201 });
    }) as typeof fetch;

    const response = await onRequest({
      request: new Request("https://example.com/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email: "person@example.com" }),
      }),
      env: {},
    });
    globalThis.fetch = original;

    assert.equal(response.status, 503);
    assert.equal(called, false);
    const body = (await response.json()) as { state: string; ok: boolean };
    assert.equal(body.ok, false);
    assert.equal(body.state, "unavailable");
  });

  it("rejects invalid email without upstream call", async () => {
    let called = false;
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      called = true;
      return new Response("{}", { status: 201 });
    }) as typeof fetch;

    const response = await onRequest({
      request: new Request("https://example.com/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      }),
      env: baseEnv,
    });
    globalThis.fetch = original;

    assert.equal(response.status, 400);
    assert.equal(called, false);
  });

  it("maps mocked 201 to confirmation_pending without claiming subscription", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () => new Response("{}", { status: 201 })) as typeof fetch;

    const response = await onRequest({
      request: new Request("https://example.com/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email: "person@example.com" }),
      }),
      env: baseEnv,
    });
    globalThis.fetch = original;

    assert.equal(response.status, 202);
    const body = (await response.json()) as { ok: boolean; state: string; message: string };
    assert.equal(body.ok, true);
    assert.equal(body.state, "confirmation_pending");
    assert.match(body.message, /confirmation email/i);
    assert.doesNotMatch(body.message, /you are on the|subscribed/i);
  });

  it("maps mocked 401 to unavailable", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () => new Response("{}", { status: 401 })) as typeof fetch;

    const response = await onRequest({
      request: new Request("https://example.com/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email: "person@example.com" }),
      }),
      env: baseEnv,
    });
    globalThis.fetch = original;

    assert.equal(response.status, 503);
    const body = (await response.json()) as { state: string };
    assert.equal(body.state, "unavailable");
  });
});
