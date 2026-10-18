/** Accepts only a real Formspree form URL. Anything else is treated as not configured. */
const FORMSPREE_ENDPOINT = /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/;

/**
 * Legacy Brevo "Simple HTML" form action URLs. Kept for parse tests and migration.
 * Live newsletter delivery uses the same-origin `/api/newsletter` Pages Function.
 */
const BREVO_FORM_ENDPOINT = /^https:\/\/([a-z0-9-]+\.)?sibforms\.com\/serve\/[A-Za-z0-9_=-]+$/i;

export function parseFormspreeEndpoint(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return FORMSPREE_ENDPOINT.test(trimmed) ? trimmed : null;
}

export function parseBrevoFormEndpoint(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return BREVO_FORM_ENDPOINT.test(trimmed) ? trimmed : null;
}

export type DeliveryDecision =
  | { readonly action: "unavailable"; readonly reason: "prototype-mode" | "missing-endpoint" }
  | { readonly action: "submit"; readonly endpoint: string };

export function decideFormDelivery(input: {
  readonly endpoint: string | null;
  readonly prototypeMode: boolean;
}): DeliveryDecision {
  if (input.prototypeMode) return { action: "unavailable", reason: "prototype-mode" };
  if (!input.endpoint) return { action: "unavailable", reason: "missing-endpoint" };
  return { action: "submit", endpoint: input.endpoint };
}

export async function postFormspree(endpoint: string, form: HTMLFormElement): Promise<Response> {
  const body = new FormData(form);
  return fetch(endpoint, {
    method: "POST",
    headers: { Accept: "application/json" },
    body,
  });
}

export type NewsletterApiState =
  | "accepted"
  | "confirmation_pending"
  | "invalid"
  | "unavailable"
  | "rejected"
  | "unconfirmed_after_network_failure";

export interface NewsletterApiResult {
  readonly ok: boolean;
  readonly state: NewsletterApiState;
  readonly message: string;
  readonly status: number;
}

/**
 * Posts to the same-origin newsletter function. Never assumes success from timers or iframes.
 */
export async function postNewsletterSignup(
  endpoint: string,
  email: string,
  signal?: AbortSignal,
): Promise<NewsletterApiResult> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
      signal,
    });
  } catch {
    return {
      ok: false,
      state: "unconfirmed_after_network_failure",
      message:
        "The connection dropped before we could confirm the result. Please wait a moment and check your inbox before trying again, or email us through Contact.",
      status: 0,
    };
  }

  let payload: Partial<NewsletterApiResult> | null = null;
  try {
    payload = (await response.json()) as Partial<NewsletterApiResult>;
  } catch {
    payload = null;
  }

  const state = (payload?.state as NewsletterApiState | undefined) ?? (response.ok ? "accepted" : "rejected");
  const message =
    typeof payload?.message === "string" && payload.message.trim()
      ? payload.message.trim()
      : response.ok
        ? "Signup received."
        : "Something went wrong and you were not added to the list.";

  const ok = Boolean(payload?.ok) && (state === "accepted" || state === "confirmation_pending");

  return {
    ok,
    state,
    message,
    status: response.status,
  };
}

/** @deprecated Removed assumed-success iframe/timer path. Use postNewsletterSignup. */
export function postBrevoNewsletter(_endpoint: string, _email: string): Promise<Response> {
  return Promise.reject(
    new Error("Legacy Brevo iframe signup removed. Use postNewsletterSignup('/api/newsletter', email)."),
  );
}
