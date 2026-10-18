import { decideFormDelivery, postFormspree } from "../lib/formDelivery";
import { resolvePuppyInterestFromQuery } from "../lib/puppyInquiry";

interface LiveFormOptions {
  form: HTMLFormElement;
  notice: HTMLElement;
  /** Shown only when delivery is unavailable (prototype mode or missing endpoint). */
  unavailableMessage: string;
  successMessage: string;
  errorMessage: string;
  endpoint: string | null;
  prototypeMode: boolean;
  /** Optional heading shown above the success message. */
  successHeading?: string;
  /** Optional transform before send (e.g. newsletter field rename). */
  submit?: (endpoint: string, form: HTMLFormElement) => Promise<Response>;
}

function errorIdFor(control: HTMLElement): string {
  return `${control.id || control.getAttribute("name") || "field"}-error`;
}

function mergeDescribedBy(control: HTMLElement, errorId: string, active: boolean): void {
  const existing = (control.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .filter((id) => id !== errorId);
  if (active) existing.push(errorId);
  if (existing.length > 0) control.setAttribute("aria-describedby", existing.join(" "));
  else control.removeAttribute("aria-describedby");
}

function setError(field: HTMLElement, message: string | null): void {
  const error = field.querySelector<HTMLElement>("[data-error]");
  const control = field.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input, select, textarea",
  );
  if (!error || !control) return;
  if (!error.id) error.id = errorIdFor(control);
  if (message) {
    error.textContent = message;
    error.hidden = false;
    control.setAttribute("aria-invalid", "true");
    mergeDescribedBy(control, error.id, true);
  } else {
    error.textContent = "";
    error.hidden = true;
    control.removeAttribute("aria-invalid");
    mergeDescribedBy(control, error.id, false);
  }
}

function validateField(field: HTMLElement): boolean {
  const control = field.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input, select, textarea",
  );
  if (!control) return true;
  if (control.disabled) {
    setError(field, null);
    return true;
  }
  if (control.validity.valid) {
    setError(field, null);
    return true;
  }
  if (control.validity.valueMissing) {
    setError(field, "This field is required.");
    return false;
  }
  if (control.validity.typeMismatch) {
    setError(field, "Please enter a valid value.");
    return false;
  }
  setError(field, control.validationMessage);
  return false;
}

function showNotice(
  notice: HTMLElement,
  message: string,
  tone: "info" | "success" | "error",
  heading?: string,
): void {
  notice.dataset.tone = tone;
  notice.classList.add("is-visible");
  if (heading && tone === "success") {
    notice.replaceChildren();
    const title = document.createElement("strong");
    title.className = "form-notice__heading";
    title.textContent = heading;
    const body = document.createElement("p");
    body.className = "form-notice__body";
    body.textContent = message;
    notice.append(title, body);
  } else {
    notice.textContent = message;
  }
}

function clearNotice(notice: HTMLElement): void {
  notice.textContent = "";
  notice.removeAttribute("data-tone");
  notice.classList.remove("is-visible");
}

export function initPrototypeForm({
  form,
  notice,
  unavailableMessage,
  successMessage,
  errorMessage,
  endpoint,
  prototypeMode,
  successHeading,
  submit = postFormspree,
}: LiveFormOptions): void {
  if (form.dataset.formInit === "true") return;
  form.dataset.formInit = "true";

  // Custom validation only after enhancement is ready.
  form.setAttribute("novalidate", "");

  const fields = Array.from(form.querySelectorAll<HTMLElement>("[data-field]"));
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  let sending = false;

  // Native POST fallback when an endpoint exists and JS later fails mid-flight.
  if (!endpoint && !form.getAttribute("action")) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  }

  fields.forEach((field) => {
    const control = field.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input, select, textarea",
    );
    control?.addEventListener("blur", () => validateField(field));
    control?.addEventListener("input", () => {
      if (control.getAttribute("aria-invalid") === "true") validateField(field);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;

    let valid = true;
    let firstInvalid: HTMLElement | null = null;
    for (const field of fields) {
      if (!validateField(field)) {
        valid = false;
        if (firstInvalid === null) {
          firstInvalid = field.querySelector<HTMLElement>("input, select, textarea");
        }
      }
    }
    if (!valid) {
      firstInvalid?.focus();
      clearNotice(notice);
      return;
    }

    const decision = decideFormDelivery({ endpoint, prototypeMode });
    if (decision.action === "unavailable") {
      showNotice(notice, unavailableMessage, "info");
      return;
    }

    sending = true;
    form.setAttribute("aria-busy", "true");
    if (submitButton) submitButton.disabled = true;
    showNotice(notice, "Sending…", "info");

    try {
      const response = await submit(decision.endpoint, form);
      if (!response.ok) throw new Error(`Delivery responded ${response.status}`);
      form.reset();
      showNotice(notice, successMessage, "success", successHeading);
    } catch (error) {
      const message =
        error instanceof TypeError
          ? "The connection dropped before we could confirm delivery. Your details are still in the form. Please wait a moment before trying again, or email us directly."
          : errorMessage;
      showNotice(notice, message, "error");
    } finally {
      sending = false;
      form.removeAttribute("aria-busy");
      if (submitButton) submitButton.disabled = false;
    }
  });
}

/**
 * Prefills a select from the query string without overwriting a later manual choice.
 * Re-applies on pageshow/popstate for refresh and history navigation.
 */
export function syncSelectFromQuery(options: {
  select: HTMLSelectElement;
  param: string;
  unknownNotice?: HTMLElement;
  /** Map additional query keys onto this select (e.g. interest → puppy). */
  aliases?: Record<string, string>;
}): void {
  const { select, param, unknownNotice, aliases } = options;
  let userTouched = false;

  const apply = () => {
    if (userTouched) return;
    const params = new URLSearchParams(window.location.search);
    let raw = params.get(param);
    if (!raw && aliases) {
      for (const [aliasKey, mapsTo] of Object.entries(aliases)) {
        if (mapsTo !== param) continue;
        const aliasValue = params.get(aliasKey);
        if (aliasValue) {
          raw = aliasValue;
          break;
        }
      }
    }

    const availableSlugs = Array.from(select.options)
      .map((option) => option.value)
      .filter((value) => value && value !== "undecided" && value !== "future-litter");

    const resolved = resolvePuppyInterestFromQuery(raw, availableSlugs);
    if (resolved.value) {
      select.value = resolved.value;
      unknownNotice?.setAttribute("hidden", "");
    } else if (resolved.unknown && unknownNotice) {
      unknownNotice.removeAttribute("hidden");
    } else {
      unknownNotice?.setAttribute("hidden", "");
    }
  };

  select.addEventListener("change", () => {
    userTouched = true;
  });

  apply();
  window.addEventListener("popstate", apply);
  window.addEventListener("pageshow", apply);
}

/** @deprecated Prefer syncSelectFromQuery for inquiry/contact puppy fields. */
export function populateSelectFromQuery(
  select: HTMLSelectElement,
  param: string,
  unknownNotice?: HTMLElement,
): void {
  syncSelectFromQuery({ select, param, unknownNotice });
}
