/**
 * Cloudflare Pages Function: POST /api/newsletter
 *
 * Secrets / bindings (never PUBLIC_*):
 * - BREVO_API_KEY (secret)
 * - BREVO_NEWSLETTER_LIST_IDS (comma-separated positive integer list IDs)
 * - BREVO_NEWSLETTER_MODE must be "doi"
 * - BREVO_DOI_TEMPLATE_ID (required)
 * - BREVO_DOI_REDIRECT_URL (required; server-controlled absolute HTTPS URL)
 *
 * Direct subscription is not allowed. Missing/invalid config returns 503
 * before any upstream call.
 */

interface Env {
  BREVO_API_KEY?: string;
  BREVO_NEWSLETTER_LIST_IDS?: string;
  BREVO_NEWSLETTER_MODE?: string;
  BREVO_DOI_TEMPLATE_ID?: string;
  BREVO_DOI_REDIRECT_URL?: string;
}

interface NewsletterJson {
  ok: boolean;
  state:
    | "confirmation_pending"
    | "invalid"
    | "unavailable"
    | "rejected"
    | "unconfirmed_after_network_failure";
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY = 4_096;
const CONFIRMATION_PENDING_MESSAGE =
  "Check your inbox for a confirmation email. Click the link to finish signing up. If you do not see it, check your spam folder.";
const UNAVAILABLE_MESSAGE =
  "Newsletter signup is temporarily unavailable. Please try again later, or use Contact.";

function json(body: NewsletterJson, status: number, htmlFallback = false): Response {
  if (htmlFallback) {
    const title = body.ok ? "Newsletter signup" : "Newsletter signup problem";
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:2rem auto;padding:0 1rem;line-height:1.5"><h1>${title}</h1><p>${escapeHtml(body.message)}</p><p><a href="/">Return to Angel Bulldogs</a></p></body></html>`;
    return new Response(html, {
      status,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wantsHtml(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html") && !accept.includes("application/json");
}

export function parseListIds(raw: string | undefined): number[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

function isAllowedRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function readEmail(request: Request): Promise<string | null> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const text = await request.text();
    if (text.length > MAX_BODY) return null;
    try {
      const data = JSON.parse(text) as { email?: unknown };
      return typeof data.email === "string" ? data.email.trim() : null;
    } catch {
      return null;
    }
  }
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    const form = await request.formData();
    const email = form.get("email") ?? form.get("EMAIL");
    return typeof email === "string" ? email.trim() : null;
  }
  return null;
}

export function configReady(
  env: Env,
): { ok: true } | { ok: false; reason: string } {
  if (!env.BREVO_API_KEY?.trim()) {
    return { ok: false, reason: "BREVO_API_KEY is not configured" };
  }
  const lists = parseListIds(env.BREVO_NEWSLETTER_LIST_IDS);
  if (lists.length === 0) {
    return { ok: false, reason: "BREVO_NEWSLETTER_LIST_IDS is not configured" };
  }
  const mode = (env.BREVO_NEWSLETTER_MODE ?? "").trim().toLowerCase();
  if (mode !== "doi") {
    return {
      ok: false,
      reason: "BREVO_NEWSLETTER_MODE must be doi",
    };
  }
  const templateId = Number(env.BREVO_DOI_TEMPLATE_ID?.trim());
  if (!Number.isInteger(templateId) || templateId <= 0) {
    return { ok: false, reason: "BREVO_DOI_TEMPLATE_ID is required for doi mode" };
  }
  const redirect = env.BREVO_DOI_REDIRECT_URL?.trim() ?? "";
  if (!redirect || !isAllowedRedirect(redirect)) {
    return { ok: false, reason: "BREVO_DOI_REDIRECT_URL must be an absolute https URL" };
  }
  return { ok: true };
}

async function callBrevoDoi(env: Env, email: string): Promise<Response> {
  const lists = parseListIds(env.BREVO_NEWSLETTER_LIST_IDS);
  return fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": env.BREVO_API_KEY!.trim(),
    },
    body: JSON.stringify({
      email,
      includeListIds: lists,
      templateId: Number(env.BREVO_DOI_TEMPLATE_ID),
      redirectionUrl: env.BREVO_DOI_REDIRECT_URL!.trim(),
    }),
    signal: AbortSignal.timeout(10_000),
  });
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  fetch?: typeof fetch;
}): Promise<Response> {
  const { request, env } = context;
  const html = wantsHtml(request);

  if (request.method === "GET" || request.method === "HEAD") {
    return json(
      {
        ok: false,
        state: "unavailable",
        message: "Use the newsletter form on the website to join the list.",
      },
      405,
      html,
    );
  }

  if (request.method !== "POST") {
    return json(
      { ok: false, state: "unavailable", message: "Method not allowed." },
      405,
      html,
    );
  }

  const ready = configReady(env);
  if (!ready.ok) {
    console.error("[newsletter] config not ready:", ready.reason);
    return json(
      {
        ok: false,
        state: "unavailable",
        message: UNAVAILABLE_MESSAGE,
      },
      503,
      html,
    );
  }

  let email: string | null = null;
  try {
    email = await readEmail(request);
  } catch {
    return json(
      {
        ok: false,
        state: "invalid",
        message: "We could not read that signup. Please try again with a valid email address.",
      },
      400,
      html,
    );
  }

  if (email === null && !(request.headers.get("content-type") ?? "").includes("json") &&
      !(request.headers.get("content-type") ?? "").includes("form")) {
    return json(
      {
        ok: false,
        state: "unavailable",
        message: "Unsupported content type.",
      },
      415,
      html,
    );
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return json(
      {
        ok: false,
        state: "invalid",
        message: "Please enter a valid email address.",
      },
      400,
      html,
    );
  }

  try {
    const response = await callBrevoDoi(env, email);
    if (response.status === 201 || response.ok) {
      return json(
        {
          ok: true,
          state: "confirmation_pending",
          message: CONFIRMATION_PENDING_MESSAGE,
        },
        202,
        html,
      );
    }

    if (response.status === 400) {
      return json(
        {
          ok: false,
          state: "rejected",
          message:
            "We could not start confirmation for that address. Your email is still available to try again, or you can use Contact.",
        },
        400,
        html,
      );
    }

    if (response.status === 401 || response.status === 403) {
      console.error("[newsletter] Brevo auth failed:", response.status);
      return json(
        {
          ok: false,
          state: "unavailable",
          message: UNAVAILABLE_MESSAGE,
        },
        503,
        html,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        "[newsletter] Brevo error:",
        response.status,
        detail.slice(0, 300),
      );
    }

    if (response.status === 429) {
      return json(
        {
          ok: false,
          state: "rejected",
          message: "Too many signup attempts right now. Please wait a moment and try again.",
        },
        429,
        html,
      );
    }

    return json(
      {
        ok: false,
        state: "rejected",
        message:
          "Something went wrong and confirmation could not be started. Your email is still available to try again, or you can use Contact.",
      },
      502,
      html,
    );
  } catch {
    return json(
      {
        ok: false,
        state: "unconfirmed_after_network_failure",
        message:
          "The request could not be confirmed. Please wait a moment and check your inbox before trying again, or email us through Contact.",
      },
      504,
      html,
    );
  }
}
