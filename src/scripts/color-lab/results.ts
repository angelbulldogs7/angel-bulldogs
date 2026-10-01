import { getLocus, locusRowLabel } from "../../data/color-lab/loci";
import { dnaRowsForGenotype } from "../../lib/color-lab/hiddenDna";
import type { LitterResult, PhenotypeGroup } from "../../lib/color-lab/inheritance";
import type { ParentInput } from "../../lib/color-lab/interestPayload";
import { resolveDog } from "../../lib/color-lab/phenotypeResolver";
import { formatFraction } from "../../lib/color-lab/probabilityFormatting";
import { pairingWarnings, type PairingWarning } from "../../lib/color-lab/safetyRules";
import type { GenotypeStatus } from "../../lib/color-lab/types";
import type { VisualCache } from "../../lib/color-lab/visualCache";
import { phenotypeCardModel } from "../../lib/color-lab/viewModels";
import { VISUAL_DISCLOSURE } from "../../data/color-lab/visualRegistry";
import { h } from "./dom";
import { dnaRowNodes, noticeNodes } from "./preview";
import { renderSafetyPanel, renderVisual } from "./visuals";

const PAGE_SIZE = 24;

const STATUS_LABEL: Readonly<Record<GenotypeStatus, string>> = {
  clear: "Clear",
  carrier: "Carrier",
  expressed: "Expressed",
  concerning: "Concerning",
  nonviable: "Nonviable",
};

function parentCard(role: "stud" | "dam", parent: ParentInput): HTMLElement[] {
  const result = resolveDog(parent.state);
  const label = role === "stud" ? "Stud (Male)" : "Dam (Female)";
  return [
    h("p", { class: "cl-review__role", text: label }),
    h("h3", { text: parent.name }),
    h("p", { class: "cl-review__name", text: result.publicName }),
    h(
      "ul",
      { class: "cl-tags" },
      h("li", {
        class: "cl-tag",
        text: parent.state.confirmation === "lab-confirmed" ? "DNA: Lab-confirmed" : "DNA: Assumed",
        attrs: { "data-tone": parent.state.confirmation === "lab-confirmed" ? "positive" : "neutral" },
      }),
      h("li", { class: "cl-tag", text: `Big Rope: ${parent.state.bigRope ? "On (visual)" : "Off"}`, attrs: { "data-tone": "neutral" } }),
    ),
    h(
      "details",
      { class: "cl-dna" },
      h("summary", { text: "Genotype" }),
      h("dl", { class: "cl-dna__rows" }, ...dnaRowNodes(dnaRowsForGenotype(parent.state.genotype))),
    ),
  ];
}

export function warningNodes(warnings: readonly PairingWarning[]): HTMLElement[] {
  return warnings.map((warning) =>
    h(
      "div",
      { class: "cl-warning", attrs: { role: "note" } },
      h("p", { class: "cl-warning__title", text: `Warning: ${warning.title}` }),
      h("p", { text: warning.text }),
    ),
  );
}

export function renderReview(root: HTMLElement, stud: ParentInput, dam: ParentInput): void {
  root.querySelector<HTMLElement>('[data-review="stud"]')?.replaceChildren(...parentCard("stud", stud));
  root.querySelector<HTMLElement>('[data-review="dam"]')?.replaceChildren(...parentCard("dam", dam));
  root
    .querySelector<HTMLElement>("[data-pairing-warnings]")
    ?.replaceChildren(...warningNodes(pairingWarnings(stud.state.genotype, dam.state.genotype)));
}

export interface ResultsView {
  render(litter: LitterResult, stud: ParentInput, dam: ParentInput): void;
  group(key: string): PhenotypeGroup | undefined;
  isRopePreviewed(key: string): boolean;
  toggleRope(key: string): void;
  clear(): void;
}

function compareText(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function createResultsView(root: HTMLElement, cache: VisualCache): ResultsView {
  const cardsHost = root.querySelector<HTMLElement>("[data-cards]");
  const moreButton = root.querySelector<HTMLButtonElement>("[data-show-more]");
  const sortSelect = root.querySelector<HTMLSelectElement>("[data-sort]");
  let litter: LitterResult | null = null;
  let shown = PAGE_SIZE;
  const ropePreview = new Set<string>();
  const groups = new Map<string, PhenotypeGroup>();

  function orderedGroups(): PhenotypeGroup[] {
    if (!litter) return [];
    const list = [...litter.groups];
    if (sortSelect?.value === "name") list.sort((a, b) => compareText(a.result.publicName, b.result.publicName));
    return list;
  }

  function card(group: PhenotypeGroup): HTMLLIElement {
    const model = phenotypeCardModel(group, ropePreview.has(group.key));
    const result = model.result;
    const frame = h("div", { class: "cl-visual__frame", attrs: { "data-visual-frame": "" } });
    const figure = h(
      "figure",
      { class: "cl-visual", attrs: { "data-visual": "" } },
      frame,
      model.kind === "viable" ? h("figcaption", { class: "cl-visual__caption", text: VISUAL_DISCLOSURE }) : null,
    );
    if (model.kind === "concerning") renderSafetyPanel(frame);
    else renderVisual(frame, cache.resolve(result.recipe), result.publicName, { lazy: true });

    const probability = h(
      "p",
      { class: "cl-card__probability" },
      h("strong", { text: `${model.percent}%` }),
      " per conception ",
      h("span", { class: "cl-card__exact", text: `(${model.exact})` }),
    );
    const viable = model.viablePercent
      ? h("p", { class: "cl-card__viable", text: `${model.viablePercent}% among potentially viable puppies` })
      : null;

    const actions = h("div", { class: "cl-card__actions" });
    if (model.canPreviewBigRope) {
      actions.append(
        h("button", {
          class: "btn btn--ghost cl-card__rope",
          text: model.bigRopePreview ? "Hide Big Rope preview" : "Preview Big Rope",
          attrs: {
            type: "button",
            "data-rope-preview": group.key,
            "aria-pressed": model.bigRopePreview ? "true" : "false",
          },
        }),
      );
    }
    if (model.eligibility.eligible) {
      actions.append(
        h("button", {
          class: "btn btn--secondary",
          text: "I’m Interested in This Puppy",
          attrs: { type: "button", "data-open-interest": "breeding", "data-group-key": group.key },
        }),
      );
    } else {
      actions.append(
        h("p", {
          class: "cl-ineligible",
          text: "Not offered for puppy interest: Double Merle (M/M) carries hearing and eye health risks.",
        }),
      );
    }

    return h(
      "li",
      { class: "cl-card", attrs: { "data-kind": model.kind } },
      figure,
      h(
        "div",
        { class: "cl-card__body" },
        model.kind === "concerning" ? h("p", { class: "cl-card__flag", text: "Double Merle (M/M) — concerning" }) : null,
        h("h3", { class: "cl-card__name", text: result.publicName }),
        result.subtitle ? h("p", { class: "cl-card__subtitle", text: result.subtitle }) : null,
        result.aliases.length > 0 ? h("p", { class: "cl-card__alias", text: `Also called ${result.aliases.join(", ")}` }) : null,
        probability,
        viable,
        model.bigRopePreview
          ? h("p", { class: "cl-card__rope-note", text: "Big Rope chance unknown — not genetically calculated." })
          : null,
        h("div", { class: "cl-notices" }, ...noticeNodes(model.notices)),
        h(
          "details",
          { class: "cl-dna" },
          h("summary", { text: "DNA details" }),
          h(
            "div",
            { class: "cl-dna__body" },
            h("h4", { class: "cl-dna__title", text: "Hidden DNA" }),
            h(
              "ul",
              { class: "cl-dna__hidden" },
              ...(model.hidden.length > 0 ? model.hidden : ["No masked genes in this group."]).map((line) =>
                h("li", { text: line }),
              ),
            ),
            h("h4", { class: "cl-dna__title", text: "Possible genotypes" }),
            h("dl", { class: "cl-dna__rows" }, ...dnaRowNodes(model.dnaRows)),
            h("p", { class: "cl-dna__note", text: "Carrier chances for each gene are in the Genotypes tab." }),
          ),
        ),
        actions,
      ),
    );
  }

  function renderCards(): void {
    if (!cardsHost || !litter) return;
    const ordered = orderedGroups();
    cardsHost.replaceChildren(...ordered.slice(0, shown).map((group) => card(group)));
    if (moreButton) {
      const remaining = ordered.length - shown;
      moreButton.hidden = remaining <= 0;
      moreButton.textContent = `Show ${Math.min(PAGE_SIZE, remaining)} more (${remaining} remaining)`;
    }
  }

  function renderSummary(result: LitterResult, stud: ParentInput, dam: ParentInput): void {
    root.querySelector<HTMLElement>("[data-results-parents]")?.replaceChildren(
      h(
        "p",
        null,
        h("strong", { text: `Stud: ${stud.name}` }),
        ` — ${resolveDog(stud.state).publicName} · `,
        h("strong", { text: `Dam: ${dam.name}` }),
        ` — ${resolveDog(dam.state).publicName}`,
      ),
    );
    root.querySelector<HTMLElement>("[data-results-warnings]")?.replaceChildren(...warningNodes(result.pairing));

    const lines: HTMLElement[] = [];
    if (result.mostLikely) {
      const names = result.mostLikely.names;
      lines.push(
        h(
          "p",
          { class: "cl-results__lead" },
          names.length > 1
            ? `${names.length} appearance groups tie for most likely at ${result.mostLikely.percent}% each: ${names.join(", ")}.`
            : `Most likely: ${names[0] ?? ""} at ${result.mostLikely.percent}% per conception.`,
        ),
      );
    }
    lines.push(h("p", { text: `${result.groups.length} appearance group${result.groups.length === 1 ? "" : "s"} in total.` }));
    if (result.doubleMerle) {
      lines.push(
        h("p", {
          class: "cl-results__alert",
          text: `Double Merle (M/M): ${result.doubleMerle.percent}% of conceptions (${formatFraction(result.doubleMerle.exact)}).`,
        }),
      );
    }
    if (result.nonviable) {
      lines.push(
        h("p", {
          class: "cl-results__alert",
          text: `FOXI3 Dup/Dup: ${result.nonviable.percent}% of conceptions are nonviable (${formatFraction(result.nonviable.exact)}).`,
        }),
      );
    }
    lines.push(h("p", { class: "cl-note", text: "Big Rope chance unknown — not genetically calculated." }));
    root.querySelector<HTMLElement>("[data-results-summary]")?.replaceChildren(...lines);

    const note = root.querySelector<HTMLElement>("[data-nonviable-note]");
    if (note) {
      note.replaceChildren(
        ...(result.nonviable
          ? [
              h(
                "div",
                { class: "cl-warning", attrs: { role: "note" } },
                h("p", { class: "cl-warning__title", text: "Nonviable conceptions are counted, not hidden" }),
                h("p", {
                  text: `${result.nonviable.percent}% of conceptions are FOXI3 Dup/Dup. They are nonviable at conception, so they have no puppy card and appear only in the Genotypes tab. Card percentages are per conception and total ${result.viableTotal.percent}%.`,
                }),
                h("p", {
                  text: `Each card also shows a viable-only share = per-conception chance ÷ ${result.viableTotal.percent}% (all conceptions except Dup/Dup), so those viable-only shares total 100.00%.`,
                }),
              ),
            ]
          : []),
      );
    }
  }

  function renderGenotypes(result: LitterResult): void {
    root.querySelector<HTMLElement>("[data-locus-results]")?.replaceChildren(
      ...result.loci.map((locus) =>
        h(
          "section",
          { class: "cl-locus-result", attrs: { "aria-labelledby": `cl-locus-${locus.locus}` } },
          h("h3", { text: locusRowLabel(getLocus(locus.locus)), attrs: { id: `cl-locus-${locus.locus}` } }),
          h(
            "ul",
            { class: "cl-locus-result__rows" },
            ...locus.rows.map((row) =>
              h(
                "li",
                { class: "cl-bar-row" },
                h(
                  "p",
                  { class: "cl-bar-row__text" },
                  h("span", { class: "cl-bar-row__genotype", text: row.display }),
                  h("span", { class: "cl-bar-row__label", text: row.label }),
                  h("span", { class: "cl-status", text: STATUS_LABEL[row.status], attrs: { "data-status": row.status } }),
                  h("span", { class: "cl-bar-row__percent", text: `${row.percent}% (${formatFraction(row.exact)})` }),
                ),
                h(
                  "span",
                  { class: "cl-bar", attrs: { "aria-hidden": "true" } },
                  h("span", { class: "cl-bar__fill", attrs: { style: `width: ${row.percent === "<0.01" ? "0" : row.percent}%` } }),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  sortSelect?.addEventListener("change", () => {
    shown = PAGE_SIZE;
    renderCards();
  });

  moreButton?.addEventListener("click", () => {
    const firstNew = shown;
    shown += PAGE_SIZE;
    renderCards();
    cardsHost?.children[firstNew]?.querySelector<HTMLElement>(".cl-card__name")?.setAttribute("tabindex", "-1");
    cardsHost?.children[firstNew]?.querySelector<HTMLElement>(".cl-card__name")?.focus();
  });

  return {
    render(result, stud, dam) {
      litter = result;
      shown = PAGE_SIZE;
      ropePreview.clear();
      groups.clear();
      for (const group of result.groups) groups.set(group.key, group);
      renderSummary(result, stud, dam);
      renderCards();
      renderGenotypes(result);
    },
    group: (key) => groups.get(key),
    isRopePreviewed: (key) => ropePreview.has(key),
    toggleRope(key) {
      if (ropePreview.has(key)) ropePreview.delete(key);
      else ropePreview.add(key);
      const index = orderedGroups().findIndex((group) => group.key === key);
      const existing = cardsHost?.children[index];
      const group = groups.get(key);
      if (existing && group) {
        const replacement = card(group);
        existing.replaceWith(replacement);
        replacement.querySelector<HTMLButtonElement>("[data-rope-preview]")?.focus();
      }
    },
    clear() {
      litter = null;
      groups.clear();
      cardsHost?.replaceChildren();
    },
  };
}
