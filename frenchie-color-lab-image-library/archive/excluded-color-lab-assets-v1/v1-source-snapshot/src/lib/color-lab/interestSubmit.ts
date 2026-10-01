export type InterestSubmitDecision =
  | { action: "unavailable"; reason: "missing-endpoint" | "prototype-mode" }
  | { action: "submit"; endpoint: string };

export function decideInterestSubmit(config: {
  endpoint: string;
  prototypeMode: boolean;
}): InterestSubmitDecision {
  if (config.prototypeMode) return { action: "unavailable", reason: "prototype-mode" };
  const endpoint = config.endpoint.trim();
  if (!endpoint) return { action: "unavailable", reason: "missing-endpoint" };
  return { action: "submit", endpoint };
}

export const INTEREST_SUCCESS_COPY =
  "Thank you—your puppy interest has been sent to the Angel Bulldogs team. A team member will reach out to discuss your preferences and potential availability.";

export const INTEREST_UNAVAILABLE_COPY =
  "Puppy-interest delivery is not connected on this preview. Your details were not sent. Use Contact or the puppy application, and keep a note of the phenotype you were viewing.";

export const INTEREST_PROTOTYPE_COPY =
  "Frontend preview only — Color Lab interest delivery will be connected before launch. Nothing was sent.";
