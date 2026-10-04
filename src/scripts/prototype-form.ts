import { decideFormDelivery, postFormspree } from "../lib/formDelivery";

interface LiveFormOptions {
  form: HTMLFormElement;
  notice: HTMLElement;
  /** Shown only when delivery is unavailable (prototype mode or missing endpoint). */
  unavailableMessage: string;
  successMessage: string;
  errorMessage: string;
  endpoint: string | null;
  prototypeMode: boolean;
  /** Optional transform before send (e.g. newsletter field rename). */
  submit?: (endpoint: string, form: HTMLFormElement) => Promise<Response>;
}

function setError(field: HTMLElement, message: string | null): void {
  const error = field.querySelector<HTMLElement>("[data-error]");
  const control = field.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input, select, textarea",
  );
  if (!error || !control) return;
  if (message) {
    error.textContent = message;
    error.hidden = false;
    control.setAttribute("aria-invalid", "true");
  } else {
    error.textContent = "";
    error.hidden = true;
    control.removeAttribute("aria-invalid");
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

function showNotice(notice: HTMLElement, message: string, tone: "info" | "success" | "error"): void {
  notice.textContent = message;
  notice.dataset.tone = tone;
  notice.classList.add("is-visible");
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
  submit = postFormspree,
}: LiveFormOptions): void {
  const fields = Array.from(form.querySelectorAll<HTMLElement>("[data-field]"));
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  let sending = false;

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
      showNotice(notice, successMessage, "success");
    } catch {
      showNotice(notice, errorMessage, "error");
    } finally {
      sending = false;
      form.removeAttribute("aria-busy");
      if (submitButton) submitButton.disabled = false;
    }
  });
}

export function populateSelectFromQuery(
  select: HTMLSelectElement,
  param: string,
  unknownNotice?: HTMLElement,
): void {
  const value = new URLSearchParams(window.location.search).get(param);
  if (!value) return;
  const match = Array.from(select.options).some((option) => option.value === value);
  if (match) {
    select.value = value;
    unknownNotice?.setAttribute("hidden", "");
  } else if (unknownNotice) {
    unknownNotice.removeAttribute("hidden");
  }
}
