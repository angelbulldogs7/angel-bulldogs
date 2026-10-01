import { buildInterestPayload, formatInterestSummary, toFormspreeBody } from "../../lib/color-lab/interestPayload";
import {
  decideInterestSubmit,
  INTEREST_PROTOTYPE_COPY,
  INTEREST_SUCCESS_COPY,
  INTEREST_UNAVAILABLE_COPY,
} from "../../lib/color-lab/interestSubmit";
import type { InterestContext } from "../../lib/color-lab/interestPayload";

export interface DrawerConfig {
  prototypeMode: boolean;
  endpoint: string;
}

function setFieldError(field: HTMLElement, message: string | null): void {
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

function validate(form: HTMLFormElement): boolean {
  let valid = true;
  let first: HTMLElement | null = null;
  for (const field of form.querySelectorAll<HTMLElement>("[data-field]")) {
    const control = field.querySelector<HTMLInputElement | HTMLSelectElement>("input, select");
    if (!control) continue;
    let message: string | null = null;
    if (control.validity.valueMissing) message = "This field is required.";
    else if (control.validity.typeMismatch) message = "Please enter a valid value.";
    setFieldError(field, message);
    if (message) {
      valid = false;
      if (!first) first = control;
    }
  }
  const consent = form.querySelector<HTMLInputElement>('input[name="consent"]');
  if (consent && !consent.checked) valid = false;
  first?.focus();
  return valid;
}

export function initInterestDrawer(root: HTMLElement, config: DrawerConfig): (context: InterestContext) => void {
  const dialog = root.querySelector<HTMLDialogElement>("[data-interest-drawer]");
  const form = root.querySelector<HTMLFormElement>("[data-interest-form]");
  const notice = root.querySelector<HTMLElement>("[data-interest-notice]");
  const contextEl = root.querySelector<HTMLElement>("[data-interest-context]");
  const submitBtn = root.querySelector<HTMLButtonElement>("[data-interest-submit]");
  if (!dialog || !form || !notice) {
    return () => undefined;
  }
  const drawer = dialog;
  const interestForm = form;
  const status = notice;

  let pending: InterestContext | null = null;
  let lastInvoker: HTMLElement | null = null;
  let sending = false;

  function close(): void {
    drawer.close();
    lastInvoker?.focus();
  }

  drawer.querySelector("[data-drawer-close]")?.addEventListener("click", () => close());
  drawer.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });

  interestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!pending || sending) return;
    const honeypot = interestForm.querySelector<HTMLInputElement>('input[name="company"]');
    if (honeypot?.value) return;
    if (!validate(interestForm)) {
      status.hidden = true;
      return;
    }
    const data = new FormData(interestForm);
    pending = {
      ...pending,
      visitor: {
        fullName: String(data.get("fullName") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? ""),
        city: String(data.get("city") ?? ""),
        state: String(data.get("state") ?? ""),
        timeframe: String(data.get("timeframe") ?? ""),
      },
    };
    const payload = buildInterestPayload(pending);
    const decision = decideInterestSubmit({
      endpoint: config.endpoint,
      prototypeMode: config.prototypeMode,
    });
    status.hidden = false;
    status.classList.add("is-visible");
    if (decision.action === "unavailable") {
      status.textContent =
        decision.reason === "prototype-mode" ? INTEREST_PROTOTYPE_COPY : INTEREST_UNAVAILABLE_COPY;
      return;
    }
    sending = true;
    if (submitBtn) submitBtn.disabled = true;
    status.textContent = "Sending…";
    try {
      const body = toFormspreeBody(payload);
      const response = await fetch(decision.endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, message: formatInterestSummary(payload) }),
      });
      if (!response.ok) throw new Error("not-ok");
      status.textContent = INTEREST_SUCCESS_COPY;
      interestForm.reset();
    } catch {
      status.textContent = "Something went wrong. Your details are still here—please try again.";
    } finally {
      sending = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  return (context: InterestContext) => {
    pending = context;
    lastInvoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (contextEl) {
      contextEl.textContent = `${context.phenotype.commonName}${
        context.probability ? ` · ${context.probability}%` : ""
      }`;
    }
    status.hidden = true;
    status.textContent = "";
    drawer.showModal();
  };
}
