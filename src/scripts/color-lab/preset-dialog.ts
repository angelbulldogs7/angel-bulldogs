import type { WorkspaceId } from "./workspace";

const TARGET_LABEL: Readonly<Record<WorkspaceId, string>> = {
  build: "your Build a Frenchie dog",
  stud: "the Stud",
  dam: "the Dam",
};

function isWorkspaceId(value: string | undefined): value is WorkspaceId {
  return value === "build" || value === "stud" || value === "dam";
}

/** One shared View All drawer; it applies to whichever dog opened it and returns focus there. */
export function initPresetDialog(
  root: HTMLElement,
  onApply: (workspace: WorkspaceId, presetId: string) => void,
): void {
  const dialog = root.querySelector<HTMLDialogElement>("[data-preset-dialog]");
  const targetLabel = dialog?.querySelector<HTMLElement>("[data-preset-target]") ?? null;
  if (!dialog) return;
  let target: WorkspaceId | null = null;
  let invoker: HTMLElement | null = null;

  root.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-open-presets]") : null;
    if (!button) return;
    const workspace = button.closest<HTMLElement>("[data-workspace]")?.dataset.workspace;
    if (!isWorkspaceId(workspace)) return;
    target = workspace;
    invoker = button;
    if (targetLabel) targetLabel.textContent = TARGET_LABEL[workspace];
    dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-dialog-preset]")?.focus();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
      return;
    }
    const button = event.target instanceof Element ? event.target.closest<HTMLElement>("button") : null;
    if (!button) return;
    if (button.hasAttribute("data-dialog-close")) {
      dialog.close();
    } else if (button.dataset.dialogPreset && target) {
      onApply(target, button.dataset.dialogPreset);
      dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    invoker?.focus();
  });
}
