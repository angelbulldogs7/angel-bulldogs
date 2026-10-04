/** Accepts only a real Formspree form URL. Anything else is treated as not configured. */
const FORMSPREE_ENDPOINT = /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/;

/**
 * Brevo "Simple HTML" form action URLs look like:
 * https://…sibforms.com/serve/…
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

/**
 * Brevo Simple HTML forms expect the email field named `EMAIL`.
 * They rarely allow CORS fetch, so we POST through a hidden iframe.
 */
export function postBrevoNewsletter(endpoint: string, email: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    const frameName = `brevo_${Date.now()}`;
    const iframe = document.createElement("iframe");
    iframe.name = frameName;
    iframe.title = "Newsletter signup";
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    iframe.style.cssText = "position:absolute;width:0;height:0;border:0;clip:rect(0,0,0,0)";

    const proxy = document.createElement("form");
    proxy.method = "POST";
    proxy.action = endpoint;
    proxy.target = frameName;
    proxy.setAttribute("aria-hidden", "true");
    proxy.style.cssText = "display:none";

    const input = document.createElement("input");
    input.type = "email";
    input.name = "EMAIL";
    input.value = email;
    proxy.appendChild(input);

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      proxy.remove();
      iframe.remove();
      if (ok) resolve(new Response(null, { status: 200 }));
      else reject(new Error("Brevo newsletter submission failed"));
    };

    iframe.addEventListener("load", () => finish(true));
    const timer = window.setTimeout(() => finish(true), 2500);

    document.body.appendChild(iframe);
    document.body.appendChild(proxy);
    try {
      proxy.submit();
    } catch {
      finish(false);
    }
  });
}
