import { missingAcknowledgements } from "./safetyRules";
import type { AcknowledgementCode, InterestEligibility } from "./types";

const FORMSPREE_ENDPOINT = /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/;

/** Accepts only a real Formspree form URL. Anything else is treated as not configured. */
export function parseFormspreeEndpoint(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return FORMSPREE_ENDPOINT.test(trimmed) ? trimmed : null;
}

export type InterestSubmitDecision =
  | { readonly action: "blocked"; readonly reason: "ineligible" }
  | { readonly action: "blocked"; readonly reason: "acknowledgement-required"; readonly missing: readonly AcknowledgementCode[] }
  | { readonly action: "unavailable"; readonly reason: "prototype-mode" | "missing-endpoint" }
  | { readonly action: "submit"; readonly endpoint: string };

export function decideInterestSubmit(input: {
  readonly endpoint: string | null;
  readonly prototypeMode: boolean;
  readonly eligibility: InterestEligibility;
  readonly acknowledged: readonly AcknowledgementCode[];
}): InterestSubmitDecision {
  if (!input.eligibility.eligible) return { action: "blocked", reason: "ineligible" };
  const missing = missingAcknowledgements(input.eligibility, input.acknowledged);
  if (missing.length > 0) return { action: "blocked", reason: "acknowledgement-required", missing };
  if (input.prototypeMode) return { action: "unavailable", reason: "prototype-mode" };
  if (!input.endpoint) return { action: "unavailable", reason: "missing-endpoint" };
  return { action: "submit", endpoint: input.endpoint };
}

export const INTEREST_SUCCESS_COPY =
  "Thank you — your puppy interest has been sent to the Angel Bulldogs team. A team member will reach out to discuss your preferences and potential availability.";

export const INTEREST_PROTOTYPE_COPY =
  "Frontend preview only — Color Lab interest delivery will be connected before launch. Nothing was sent, and your details are still in the form.";

export const INTEREST_UNAVAILABLE_COPY =
  "Puppy-interest delivery isn't connected yet, so nothing was sent. Your details are still in the form; please use the Contact page for now.";

export const INTEREST_ERROR_COPY =
  "Something went wrong and your interest was not sent. Your details are still here — please try again.";
