interface PrototypeFormOptions {
  form: HTMLFormElement;
  notice: HTMLElement;
  message: string;
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

export function initPrototypeForm({ form, notice, message }: PrototypeFormOptions): void {
  const fields = Array.from(form.querySelectorAll<HTMLElement>("[data-field]"));

  fields.forEach((field) => {
    const control = field.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input, select, textarea",
    );
    control?.addEventListener("blur", () => validateField(field));
    control?.addEventListener("input", () => {
      if (control.getAttribute("aria-invalid") === "true") validateField(field);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    // TODO: Connect Formspree here. Do not call fetch() until a verified endpoint exists.
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
      notice.classList.remove("is-visible");
      notice.textContent = "";
      return;
    }
    notice.textContent = message;
    notice.classList.add("is-visible");
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
