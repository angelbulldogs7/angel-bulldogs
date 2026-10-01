import {
  buildInterestPayload,
  toFormspreeBody,
  type InterestContext,
  type InterestVisitor,
} from "../../lib/color-lab/interestPayload";
import {
  INTEREST_ERROR_COPY,
  INTEREST_PROTOTYPE_COPY,
  INTEREST_SUCCESS_COPY,
  INTEREST_UNAVAILABLE_COPY,
  decideInterestSubmit,
} from "../../lib/color-lab/interestSubmit";
import { interestEligibility } from "../../lib/color-lab/safetyRules";
import type { AcknowledgementCode } from "../../lib/color-lab/types";
import { h } from "./dom";

export interface DrawerConfig {
  readonly prototypeMode: boolean;
  readonly endpoint: string | null;
  readonly announce: (message: string) => void;
}

type FieldControl = HTMLInputElement | HTMLSelectElement;

function isAcknowledgement(value: string | undefined): value is AcknowledgementCode {
  return value === "hairless" || value === "pink";
}

function fieldMessage(control: FieldControl): string | null {
  const validity = control.validity;
  if (validity.valueMissing) {
    return control instanceof HTMLInputElement && control.type === "checkbox"
      ? "Please confirm to continue."
      : "This field is required.";
  }
  if (validity.typeMismatch) return "Please enter a valid email address.";
  if (validity.patternMismatch) return "Please enter a valid phone number.";
  if (validity.tooLong) return "This entry is too long.";
  return null;
}

export function initInterestDrawer(
  root: HTMLElement,
  config: DrawerConfig,
): (context: InterestContext, invoker: HTMLElement) => void {
  const dialog = root.querySelector<HTMLDialogElement>("[data-interest-drawer]");
  const form = dialog?.querySelector<HTMLFormElement>("[data-interest-form]");
  const status = dialog?.querySelector<HTMLElement>("[data-interest-status]");
  const submit = dialog?.querySelector<HTMLButtonElement>("[data-interest-submit]");
  const contextHost = dialog?.querySelector<HTMLElement>("[data-interest-context]");
  const acks = dialog?.querySelector<HTMLFieldSetElement>("[data-acks]");
  const ackError = dialog?.querySelector<HTMLElement>("[data-ack-error]");
  if (!dialog || !form || !status || !submit) return () => undefined;
  const drawer = dialog;
  const interestForm = form;
  const statusLine = status;
  const submitButton = submit;

  let context: InterestContext | null = null;
  let invoker: HTMLElement | null = null;
  let sending = false;

  function setStatus(message: string, tone: "info" | "success" | "error"): void {
    statusLine.textContent = message;
    statusLine.dataset.tone = tone;
    statusLine.hidden = false;
  }

  function setFieldError(field: HTMLElement, message: string | null): void {
    const control = field.querySelector<FieldControl>("input, select");
    const error = field.querySelector<HTMLElement>("[data-error]");
    if (!control || !error) return;
    error.textContent = message ?? "";
    error.hidden = !message;
    if (message) control.setAttribute("aria-invalid", "true");
    else control.removeAttribute("aria-invalid");
  }

  function validate(): boolean {
    let first: FieldControl | null = null;
    for (const field of interestForm.querySelectorAll<HTMLElement>("[data-field]")) {
      const control = field.querySelector<FieldControl>("input, select");
      if (!control) continue;
      if (control instanceof HTMLInputElement && control.type !== "checkbox") control.value = control.value.trim();
      const message = fieldMessage(control);
      setFieldError(field, message);
      if (message && !first) first = control;
    }
    first?.focus();
    return first === null;
  }

  function acknowledged(): AcknowledgementCode[] {
    return [...interestForm.querySelectorAll<HTMLInputElement>("input[data-ack]")]
      .filter((input) => input.checked && !input.closest<HTMLElement>("[data-ack-row]")?.hidden)
      .map((input) => input.dataset.ack)
      .filter(isAcknowledgement);
  }

  function describe(current: InterestContext): HTMLElement[] {
    const nodes: HTMLElement[] = [h("p", { class: "cl-drawer__puppy", text: current.result.publicName })];
    if (current.source === "breeding") {
      nodes.push(
        h("p", {
          text: `${current.group.percent}% per conception · Stud: ${current.stud.name} · Dam: ${current.dam.name}`,
        }),
      );
      if (current.bigRopePreview) nodes.push(h("p", { text: "Big Rope preview on — its chance is unknown and not calculated." }));
    } else {
      nodes.push(
        h("p", {
          text: `From Build a Frenchie · DNA: ${current.state.confirmation === "lab-confirmed" ? "Lab-confirmed" : "Assumed"}`,
        }),
      );
    }
    nodes.push(h("p", { class: "cl-drawer__small", text: "Your selected DNA and this puppy's details are included automatically." }));
    return nodes;
  }

  function close(): void {
    drawer.close();
  }

  drawer.addEventListener("close", () => {
    invoker?.focus();
  });
  drawer.addEventListener("click", (event) => {
    if (event.target === drawer) close();
    const button = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-dialog-close]") : null;
    if (button) close();
  });

  interestForm.addEventListener("input", (event) => {
    const field = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-field]") : null;
    const control = field?.querySelector<FieldControl>("input, select");
    if (field && control?.getAttribute("aria-invalid") === "true") setFieldError(field, fieldMessage(control));
  });

  interestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!context || sending) return;
    const honeypot = interestForm.querySelector<HTMLInputElement>('input[name="company"]');
    if (honeypot?.value) return;
    if (!validate()) {
      statusLine.hidden = true;
      return;
    }

    const eligibility = interestEligibility(context.result);
    const acknowledgements = acknowledged();
    const decision = decideInterestSubmit({
      endpoint: config.endpoint,
      prototypeMode: config.prototypeMode,
      eligibility,
      acknowledged: acknowledgements,
    });

    if (ackError) {
      const missing = decision.action === "blocked" && decision.reason === "acknowledgement-required";
      ackError.textContent = missing ? "Please read and check each acknowledgement above." : "";
      ackError.hidden = !missing;
      if (missing) interestForm.querySelector<HTMLInputElement>("input[data-ack]:not(:checked)")?.focus();
    }
    if (decision.action === "blocked") {
      if (decision.reason === "ineligible") setStatus("This outcome is not offered for puppy interest.", "error");
      return;
    }
    if (decision.action === "unavailable") {
      setStatus(decision.reason === "prototype-mode" ? INTEREST_PROTOTYPE_COPY : INTEREST_UNAVAILABLE_COPY, "info");
      config.announce("Interest was not sent.");
      return;
    }

    const data = new FormData(interestForm);
    const visitor: InterestVisitor = {
      fullName: String(data.get("fullName") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      city: String(data.get("city") ?? ""),
      state: String(data.get("state") ?? ""),
      timeframe: String(data.get("timeframe") ?? ""),
    };
    const payload = buildInterestPayload(context, visitor, acknowledgements);

    sending = true;
    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    interestForm.setAttribute("aria-busy", "true");
    setStatus("Sending your interest…", "info");
    try {
      const response = await fetch(decision.endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(toFormspreeBody(payload)),
      });
      if (!response.ok) throw new Error(`Formspree responded ${response.status}`);
      interestForm.reset();
      setStatus(INTEREST_SUCCESS_COPY, "success");
      config.announce("Your puppy interest was sent.");
    } catch {
      setStatus(INTEREST_ERROR_COPY, "error");
      config.announce("Interest was not sent. Your details are still in the form.");
    } finally {
      sending = false;
      submitButton.disabled = false;
      submitButton.textContent = "Send interest";
      interestForm.removeAttribute("aria-busy");
    }
  });

  return (next, from) => {
    const eligibility = interestEligibility(next.result);
    if (!eligibility.eligible) return;
    context = next;
    invoker = from;
    contextHost?.replaceChildren(...describe(next));
    const required = eligibility.acknowledgements;
    if (acks) acks.hidden = required.length === 0;
    for (const row of interestForm.querySelectorAll<HTMLElement>("[data-ack-row]")) {
      const code = row.dataset.ackRow;
      row.hidden = !isAcknowledgement(code) || !required.includes(code);
      const input = row.querySelector<HTMLInputElement>("input");
      if (input) input.checked = false;
    }
    if (ackError) ackError.hidden = true;
    statusLine.hidden = true;
    drawer.showModal();
    interestForm.querySelector<HTMLInputElement>("#cl-full-name")?.focus();
  };
}
