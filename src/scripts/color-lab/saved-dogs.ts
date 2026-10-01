import { loadRequiresSexConfirm, expectedSexForRole, type ParentRole } from "../../lib/color-lab/parents";
import {
  createSavedDog,
  deleteSavedDog,
  loadSavedDogs,
  savedDogState,
  upsertSavedDog,
} from "../../lib/color-lab/storage";
import type { KeyValueStore, SavedDog } from "../../lib/color-lab/types";
import { h } from "./dom";
import type { WorkspaceController, WorkspaceId } from "./workspace";

function browserStore(): KeyValueStore | null {
  try {
    const store = window.localStorage;
    const probe = "angel-bulldogs.color-lab.probe";
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

function isWorkspaceId(value: string | undefined): value is WorkspaceId {
  return value === "build" || value === "stud" || value === "dam";
}

function newId(): string {
  return typeof crypto.randomUUID === "function"
    ? `dog-${crypto.randomUUID()}`
    : `dog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface SavedDogsOptions {
  readonly workspaces: Readonly<Record<WorkspaceId, WorkspaceController>>;
  /** The name typed for a parent, or "" when the field is empty. */
  readonly parentName: (role: ParentRole) => string;
  readonly setParentName: (role: ParentRole, name: string) => void;
  readonly announce: (message: string) => void;
}

export function initSavedDogs(root: HTMLElement, options: SavedDogsOptions): void {
  const store = browserStore();
  let dogs: SavedDog[] = store ? loadSavedDogs(store).dogs : [];
  const sections = [...root.querySelectorAll<HTMLElement>("[data-saved]")];

  function render(): void {
    for (const section of sections) {
      const workspace = section.dataset.saved;
      const list = section.querySelector<HTMLElement>("[data-saved-list]");
      if (!list || !isWorkspaceId(workspace)) continue;
      if (!store) {
        list.replaceChildren(
          h("li", {
            class: "cl-saved__empty",
            text: "Saving is unavailable in this browser (private browsing or blocked storage).",
          }),
        );
        section.querySelector<HTMLButtonElement>("[data-save-form] button[type='submit']")?.setAttribute("disabled", "");
        continue;
      }
      if (dogs.length === 0) {
        list.replaceChildren(h("li", { class: "cl-saved__empty", text: "No dogs saved in this browser yet." }));
        continue;
      }
      list.replaceChildren(
        ...dogs.map((dog) =>
          h(
            "li",
            { class: "cl-saved__item" },
            h(
              "p",
              { class: "cl-saved__meta" },
              h("strong", { text: dog.name }),
              ` · ${dog.sex === "female" ? "Female" : "Male"} · ${dog.phenotype.publicName} · ${
                dog.confirmation === "lab-confirmed" ? "Lab-confirmed" : "Assumed"
              }`,
            ),
            h(
              "div",
              { class: "cl-saved__actions" },
              h("button", {
                class: "btn btn--secondary",
                text: workspace === "build" ? "Load" : `Load as ${workspace === "stud" ? "Stud" : "Dam"}`,
                attrs: { type: "button", "data-load-dog": dog.id, "aria-label": `Load ${dog.name}` },
              }),
              h("button", {
                class: "btn btn--ghost",
                text: "Delete",
                attrs: { type: "button", "data-delete-dog": dog.id, "aria-label": `Delete ${dog.name}` },
              }),
            ),
          ),
        ),
      );
    }
  }

  function showError(section: HTMLElement, message: string | null): void {
    const error = section.querySelector<HTMLElement>("[data-save-error]");
    if (!error) return;
    error.textContent = message ?? "";
    error.hidden = !message;
  }

  function save(section: HTMLElement, workspace: WorkspaceId): void {
    if (!store) return;
    const form = section.querySelector<HTMLFormElement>("[data-save-form]");
    let name: string;
    let sex: SavedDog["sex"];
    if (workspace === "build") {
      const input = form?.querySelector<HTMLInputElement>("[data-save-name]");
      name = input?.value ?? "";
      sex = form?.querySelector<HTMLInputElement>("input[name='build-dog-sex']:checked")?.value === "male" ? "male" : "female";
    } else {
      name = options.parentName(workspace);
      sex = expectedSexForRole(workspace);
    }
    const dog = createSavedDog({ id: newId(), name, sex, state: options.workspaces[workspace].state(), now: new Date().toISOString() });
    if (!dog) {
      showError(section, workspace === "build" ? "Enter a dog name before saving." : "Enter a name above before saving.");
      (workspace === "build"
        ? form?.querySelector<HTMLInputElement>("[data-save-name]")
        : root.querySelector<HTMLInputElement>(`[data-parent-name="${workspace}"]`)
      )?.focus();
      return;
    }
    const next = upsertSavedDog(store, dog);
    if (!next) {
      showError(section, "This browser could not save the dog. Storage may be full.");
      return;
    }
    showError(section, null);
    dogs = next;
    if (workspace === "build") {
      const input = form?.querySelector<HTMLInputElement>("[data-save-name]");
      if (input) input.value = "";
    }
    render();
    options.announce(`${dog.name} saved in this browser.`);
  }

  function load(workspace: WorkspaceId, id: string): void {
    const dog = dogs.find((item) => item.id === id);
    if (!dog) return;
    if (workspace !== "build" && loadRequiresSexConfirm(dog.sex, workspace)) {
      const role = workspace === "stud" ? "Stud (male)" : "Dam (female)";
      const ok = window.confirm(
        `${dog.name} is saved as ${dog.sex}. Load this DNA as the ${role} anyway? The saved dog will not be relabeled.`,
      );
      if (!ok) return;
    }
    if (workspace !== "build") options.setParentName(workspace, dog.name);
    options.workspaces[workspace].replace(savedDogState(dog), `Loaded ${dog.name}.`);
  }

  root.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button") : null;
    const section = button?.closest<HTMLElement>("[data-saved]");
    const workspace = section?.dataset.saved;
    if (!button || !section || !isWorkspaceId(workspace) || !store) return;
    if (button.dataset.loadDog) {
      load(workspace, button.dataset.loadDog);
    } else if (button.dataset.deleteDog) {
      const dog = dogs.find((item) => item.id === button.dataset.deleteDog);
      if (!dog || !window.confirm(`Delete ${dog.name} from this browser?`)) return;
      const next = deleteSavedDog(store, dog.id);
      if (next) {
        dogs = next;
        render();
        options.announce(`${dog.name} deleted from this browser.`);
      }
    }
  });

  for (const section of sections) {
    const workspace = section.dataset.saved;
    section.querySelector<HTMLFormElement>("[data-save-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (isWorkspaceId(workspace)) save(section, workspace);
    });
  }

  render();
}
