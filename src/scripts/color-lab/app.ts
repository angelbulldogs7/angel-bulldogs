import { baselineDogState } from "../../lib/color-lab/dogState";
import { calculateLitter, type LitterResult } from "../../lib/color-lab/inheritance";
import type { ParentInput } from "../../lib/color-lab/interestPayload";
import { parseFormspreeEndpoint } from "../../lib/color-lab/interestSubmit";
import { expectedSexForRole, type ParentRole } from "../../lib/color-lab/parents";
import { resolveDog, resolveProfile } from "../../lib/color-lab/phenotypeResolver";
import { sanitizeDogName } from "../../lib/color-lab/validation";
import { createVisualCache } from "../../lib/color-lab/visualCache";
import { dogPreviewModel } from "../../lib/color-lab/viewModels";
import { announce, focusHeading } from "./dom";
import { initInterestDrawer } from "./drawer";
import { initPresetDialog } from "./preset-dialog";
import { renderPreview } from "./preview";
import { createResultsView, renderReview } from "./results";
import { initSavedDogs } from "./saved-dogs";
import { initTabs } from "./tabs";
import { createWorkspace, type WorkspaceController, type WorkspaceId } from "./workspace";

type Step = "stud" | "dam" | "review" | "results";

function isStep(value: string | undefined): value is Step {
  return value === "stud" || value === "dam" || value === "review" || value === "results";
}

function run(root: HTMLElement): void {
  const say = (message: string) => announce(root, message);
  initTabs(root, "[data-primary-tabs] > .cl-tabs__list");
  initTabs(root, "[data-result-tabs] > .cl-tabs__list");

  const cache = createVisualCache();
  const workspaceRoot = (id: WorkspaceId) => root.querySelector<HTMLElement>(`[data-workspace="${id}"]`);
  const buildRoot = workspaceRoot("build");
  const studRoot = workspaceRoot("stud");
  const damRoot = workspaceRoot("dam");
  if (!buildRoot || !studRoot || !damRoot) return;

  const workspaces: Record<WorkspaceId, WorkspaceController> = {
    build: createWorkspace(buildRoot, "build", baselineDogState(), say),
    stud: createWorkspace(studRoot, "stud", baselineDogState(), say),
    dam: createWorkspace(damRoot, "dam", baselineDogState(), say),
  };

  const preview = root.querySelector<HTMLElement>("[data-preview]");
  let lastPreviewName = resolveDog(workspaces.build.state()).publicName;
  const renderBuild = () => {
    if (!preview) return;
    const model = dogPreviewModel(workspaces.build.state());
    renderPreview(preview, model, cache);
    if (model.result.publicName !== lastPreviewName) {
      lastPreviewName = model.result.publicName;
      say(`Preview: ${model.result.publicName}`);
    }
  };
  workspaces.build.subscribe(renderBuild);
  renderBuild();

  const enteredParentName = (role: ParentRole): string =>
    sanitizeDogName(root.querySelector<HTMLInputElement>(`[data-parent-name="${role}"]`)?.value);
  const parentName = (role: ParentRole): string => enteredParentName(role) || (role === "stud" ? "Stud" : "Dam");
  const parentInput = (role: ParentRole): ParentInput => ({
    name: parentName(role),
    sex: expectedSexForRole(role),
    state: workspaces[role].state(),
  });

  const resultsStep = root.querySelector<HTMLButtonElement>('[data-go-step="results"]');
  const results = createResultsView(root, cache);
  let calculated: { stud: ParentInput; dam: ParentInput; litter: LitterResult } | null = null;

  const invalidateResults = () => {
    if (!calculated) return;
    calculated = null;
    results.clear();
    if (resultsStep) resultsStep.disabled = true;
  };

  for (const role of ["stud", "dam"] as const) {
    const summary = root.querySelector<HTMLElement>(`[data-parent-summary="${role}"]`);
    const update = () => {
      const state = workspaces[role].state();
      if (summary) {
        summary.textContent = `${resolveDog(state).publicName} · DNA: ${
          state.confirmation === "lab-confirmed" ? "Lab-confirmed" : "Assumed"
        }`;
      }
      invalidateResults();
    };
    workspaces[role].subscribe(update);
    root.querySelector<HTMLInputElement>(`[data-parent-name="${role}"]`)?.addEventListener("input", invalidateResults);
  }

  const showStep = (step: Step, moveFocus: boolean) => {
    for (const panel of root.querySelectorAll<HTMLElement>("[data-step-panel]")) {
      panel.hidden = panel.dataset.stepPanel !== step;
    }
    for (const button of root.querySelectorAll<HTMLButtonElement>(".cl-step[data-go-step]")) {
      if (button.dataset.goStep === step) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    }
    if (step === "review") renderReview(root, parentInput("stud"), parentInput("dam"));
    if (moveFocus) {
      focusHeading(root.querySelector<HTMLElement>(`[data-step-panel="${step}"] h2[tabindex="-1"]`));
    }
  };

  initPresetDialog(root, (workspace, presetId) => workspaces[workspace].applyPreset(presetId));
  initSavedDogs(root, {
    workspaces,
    parentName: enteredParentName,
    setParentName(role, name) {
      const input = root.querySelector<HTMLInputElement>(`[data-parent-name="${role}"]`);
      if (input) input.value = name;
    },
    announce: say,
  });

  const openInterest = initInterestDrawer(root, {
    prototypeMode: root.dataset.prototypeMode === "true",
    endpoint: parseFormspreeEndpoint(root.dataset.formspreeEndpoint),
    announce: say,
  });

  const calculateButton = root.querySelector<HTMLButtonElement>("[data-calculate]");
  const calculate = () => {
    if (!calculateButton || calculateButton.disabled) return;
    calculateButton.disabled = true;
    calculateButton.textContent = "Calculating…";
    const stud = parentInput("stud");
    const dam = parentInput("dam");
    // Let the busy state paint before the synchronous, exact calculation.
    window.setTimeout(() => {
      try {
        const litter = calculateLitter(stud.state.genotype, dam.state.genotype);
        results.render(litter, stud, dam);
        calculated = { stud, dam, litter };
        if (resultsStep) resultsStep.disabled = false;
        showStep("results", true);
        const top = litter.mostLikely;
        say(
          `Litter calculated: ${litter.groups.length} appearance groups.${
            top ? ` Most likely ${top.names.join(", ")} at ${top.percent}%.` : ""
          }`,
        );
      } finally {
        calculateButton.disabled = false;
        calculateButton.textContent = "Calculate litter";
      }
    }, 30);
  };

  root.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("button") : null;
    if (!target || !root.contains(target)) return;

    const step = target.dataset.goStep;
    if (isStep(step)) {
      if (step === "results" && !calculated) return;
      showStep(step, true);
      return;
    }
    if (target.hasAttribute("data-calculate")) {
      calculate();
      return;
    }
    if (target.hasAttribute("data-edit-parents")) {
      showStep("review", true);
      return;
    }
    if (target.dataset.ropePreview) {
      results.toggleRope(target.dataset.ropePreview);
      return;
    }
    if (target.dataset.openInterest === "build") {
      const state = workspaces.build.state();
      const result = resolveDog(state);
      if (result.kind === "viable") openInterest({ source: "build", state, result }, target);
      return;
    }
    if (target.dataset.openInterest === "breeding" && target.dataset.groupKey && calculated) {
      const group = results.group(target.dataset.groupKey);
      if (!group || group.result.kind !== "viable") return;
      const bigRopePreview = results.isRopePreviewed(group.key);
      const result = bigRopePreview ? resolveProfile(group.result.profile, { bigRope: true }) : group.result;
      if (result.kind !== "viable") return;
      openInterest(
        {
          source: "breeding",
          group,
          result,
          bigRopePreview,
          stud: calculated.stud,
          dam: calculated.dam,
          nonviablePercent: calculated.litter.nonviable?.percent ?? null,
        },
        target,
      );
    }
  });

  showStep("stud", false);
}

const root = document.querySelector<HTMLElement>("[data-color-lab]");
if (root) run(root);
