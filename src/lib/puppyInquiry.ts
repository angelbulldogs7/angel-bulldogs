/** Discriminator for new short inquiries vs historical full applications in Formspree. */
export const PUPPY_INQUIRY_FORM_VERSION = "puppy-inquiry-v1";

export const PUPPY_INTEREST_UNDECIDED = "undecided";
export const PUPPY_INTEREST_FUTURE_LITTER = "future-litter";

export const TIMING_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-3-months", label: "Within 1–3 months" },
  { value: "3-6-months", label: "Within 3–6 months" },
  { value: "flexible", label: "Flexible" },
  { value: "researching", label: "Just researching" },
] as const;

export const LOOKING_FOR_OPTIONS = [
  { value: "family-companion", label: "Family companion" },
  { value: "breeding-rights", label: "Discuss breeding rights" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export type TimingValue = (typeof TIMING_OPTIONS)[number]["value"];
export type LookingForValue = (typeof LOOKING_FOR_OPTIONS)[number]["value"];

export const GENERAL_PUPPY_INTEREST_VALUES = [
  PUPPY_INTEREST_UNDECIDED,
  PUPPY_INTEREST_FUTURE_LITTER,
] as const;

export function isGeneralPuppyInterest(value: string): boolean {
  return (GENERAL_PUPPY_INTEREST_VALUES as readonly string[]).includes(value);
}

export function resolvePuppyInterestFromQuery(
  raw: string | null,
  availableSlugs: readonly string[],
): { value: string | null; unknown: boolean } {
  if (!raw) return { value: null, unknown: false };
  const slug = raw.trim().toLowerCase();
  if (!slug) return { value: null, unknown: false };
  if (isGeneralPuppyInterest(slug)) return { value: slug, unknown: false };
  if (availableSlugs.includes(slug)) return { value: slug, unknown: false };
  return { value: null, unknown: true };
}

export interface PuppyInquiryFields {
  fullName: string;
  email: string;
  location: string;
  puppyInterest: string;
  timing: string;
  lookingFor: string;
  phone: string;
  message: string;
  inquiryAck: boolean;
}

export interface PuppyInquiryValidation {
  readonly ok: boolean;
  readonly errors: Readonly<Partial<Record<keyof PuppyInquiryFields, string>>>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePuppyInquiry(
  fields: PuppyInquiryFields,
  availableSlugs: readonly string[],
): PuppyInquiryValidation {
  const errors: Partial<Record<keyof PuppyInquiryFields, string>> = {};
  const allowedInterest = new Set<string>([
    ...availableSlugs,
    PUPPY_INTEREST_UNDECIDED,
    PUPPY_INTEREST_FUTURE_LITTER,
  ]);

  if (!fields.fullName.trim()) errors.fullName = "This field is required.";
  if (!fields.email.trim()) errors.email = "This field is required.";
  else if (!EMAIL_PATTERN.test(fields.email.trim())) errors.email = "Please enter a valid email.";
  if (!fields.location.trim()) errors.location = "This field is required.";
  if (!fields.puppyInterest) errors.puppyInterest = "This field is required.";
  else if (!allowedInterest.has(fields.puppyInterest)) {
    errors.puppyInterest = "Please choose a valid puppy interest.";
  }
  if (!fields.timing) errors.timing = "This field is required.";
  else if (!(TIMING_OPTIONS as readonly { value: string }[]).some((o) => o.value === fields.timing)) {
    errors.timing = "Please choose a timing option.";
  }
  if (!fields.lookingFor) errors.lookingFor = "This field is required.";
  else if (!(LOOKING_FOR_OPTIONS as readonly { value: string }[]).some((o) => o.value === fields.lookingFor)) {
    errors.lookingFor = "Please choose what you are looking for.";
  }
  if (!fields.inquiryAck) errors.inquiryAck = "Please confirm before sending.";

  return { ok: Object.keys(errors).length === 0, errors };
}

/** Presentation-only labels for the owner notification; does not invent visitor answers. */
export function presentOptionalValue(value: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed : "Not provided";
}

export function buildPuppyInquiryFormData(
  fields: PuppyInquiryFields,
  options?: { readonly subjectPrefix?: string },
): FormData {
  const body = new FormData();
  const prefix = options?.subjectPrefix ?? "Puppy Inquiry";
  body.set("_subject", `${prefix}: ${fields.fullName.trim() || "New visitor"}`);
  body.set("formVersion", PUPPY_INQUIRY_FORM_VERSION);
  body.set("fullName", fields.fullName.trim());
  body.set("email", fields.email.trim());
  body.set("location", fields.location.trim());
  body.set("puppyInterest", fields.puppyInterest);
  body.set("timing", fields.timing);
  body.set("lookingFor", fields.lookingFor);
  body.set("phone", presentOptionalValue(fields.phone));
  body.set("message", presentOptionalValue(fields.message));
  body.set("inquiryAck", fields.inquiryAck ? "yes" : "no");
  return body;
}

export async function postPuppyInquiry(endpoint: string, fields: PuppyInquiryFields): Promise<Response> {
  return fetch(endpoint, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: buildPuppyInquiryFormData(fields),
  });
}
