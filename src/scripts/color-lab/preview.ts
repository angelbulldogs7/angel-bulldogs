import type { DnaRow } from "../../lib/color-lab/hiddenDna";
import type { VisualCache } from "../../lib/color-lab/visualCache";
import type { DogPreviewModel, NoticeView } from "../../lib/color-lab/viewModels";
import { h } from "./dom";
import { renderSafetyPanel, renderVisual } from "./visuals";

export function noticeNodes(notices: readonly NoticeView[]): HTMLElement[] {
  return notices.map((notice) =>
    h(
      "p",
      { class: "cl-notice", attrs: { "data-severity": notice.severity } },
      h("strong", { text: `${notice.title}.` }),
      ` ${notice.text}`,
    ),
  );
}

export function dnaRowNodes(rows: readonly DnaRow[]): HTMLElement[] {
  return rows.map((row) =>
    h(
      "div",
      { class: "cl-dna__row" },
      h("dt", { text: row.locusName }),
      h(
        "dd",
        null,
        ...row.genotypes.map((item) =>
          h("span", { class: "cl-dna__genotype" }, `${item.display} `, h("span", { class: "cl-dna__label", text: item.label })),
        ),
      ),
    ),
  );
}

function listItems(lines: readonly string[], empty: string): HTMLElement[] {
  return (lines.length > 0 ? lines : [empty]).map((line) => h("li", { text: line }));
}

export function renderPreview(root: HTMLElement, model: DogPreviewModel, cache: VisualCache): void {
  const { result } = model;
  const frame = root.querySelector<HTMLElement>("[data-visual-frame]");
  if (frame) {
    if (result.kind === "concerning") renderSafetyPanel(frame);
    else renderVisual(frame, cache.resolve(result.recipe), result.publicName, { lazy: false });
  }

  const name = root.querySelector<HTMLElement>("[data-preview-name]");
  if (name) name.textContent = result.publicName;
  const subtitle = root.querySelector<HTMLElement>("[data-preview-subtitle]");
  if (subtitle) {
    subtitle.textContent = result.subtitle ?? "";
    subtitle.hidden = !result.subtitle;
  }
  const alias = root.querySelector<HTMLElement>("[data-preview-alias]");
  if (alias) {
    alias.textContent = result.aliases.length > 0 ? `Also called ${result.aliases.join(", ")}` : "";
    alias.hidden = result.aliases.length === 0;
  }

  root.querySelector<HTMLElement>("[data-preview-tags]")?.replaceChildren(
    h("li", {
      class: "cl-tag",
      text: model.confirmation === "lab-confirmed" ? "DNA: Lab-confirmed" : "DNA: Assumed",
      attrs: { "data-tone": model.confirmation === "lab-confirmed" ? "positive" : "neutral" },
    }),
    ...(result.tokens.bigRope
      ? [h("li", { class: "cl-tag", text: "Big Rope: visual preference", attrs: { "data-tone": "neutral" } })]
      : []),
    ...(result.kind === "concerning"
      ? [h("li", { class: "cl-tag", text: "Double Merle — health concern", attrs: { "data-tone": "critical" } })]
      : []),
  );

  root.querySelector<HTMLElement>("[data-preview-notices]")?.replaceChildren(...noticeNodes(model.notices));
  root
    .querySelector<HTMLElement>("[data-preview-hidden]")
    ?.replaceChildren(...listItems([...model.carriers, ...model.hidden], "No hidden carriers or masked genes."));
  root.querySelector<HTMLElement>("[data-preview-rows]")?.replaceChildren(...dnaRowNodes(model.dnaRows));

  const interest = root.querySelector<HTMLButtonElement>("[data-open-interest]");
  const blocked = root.querySelector<HTMLElement>("[data-interest-blocked]");
  const eligible = model.eligibility.eligible;
  if (interest) interest.hidden = !eligible;
  if (blocked) {
    blocked.hidden = eligible;
    blocked.textContent = eligible
      ? ""
      : "Double Merle (M/M) is not offered for puppy interest because of its hearing and eye health risks.";
  }
}
