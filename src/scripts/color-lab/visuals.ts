import { COMING_SOON_SRC, VISUAL_HEIGHT, VISUAL_WIDTH } from "../../data/color-lab/visualRegistry";
import type { ApprovedAsset, VisualResolution } from "../../lib/color-lab/types";
import { visualAlt } from "../../lib/color-lab/visualRecipe";
import { h } from "./dom";

const PLACEHOLDER: ApprovedAsset = { src: COMING_SOON_SRC, width: VISUAL_WIDTH, height: VISUAL_HEIGHT };

/** Renders approved layers or the branded placeholder into a 4:5 frame. Paths come only from the registry. */
export function renderVisual(
  frame: HTMLElement,
  resolution: VisualResolution,
  publicName: string,
  options: { lazy: boolean },
): void {
  const approved = resolution.status === "approved";
  const layers = approved ? resolution.layers : [PLACEHOLDER];
  const alt = visualAlt(publicName, approved);
  const key = `${resolution.signature}|${alt}`;
  if (frame.dataset.renderedKey === key) return;
  frame.dataset.renderedKey = key;
  const figure = frame.closest<HTMLElement>("[data-visual]");
  figure?.setAttribute("data-visual-id", resolution.visualId);
  const caption = figure?.querySelector<HTMLElement>(".cl-visual__caption");
  if (caption) caption.hidden = false;

  const current = [...frame.querySelectorAll<HTMLImageElement>("img.cl-visual__layer")];
  const sameSources =
    current.length === layers.length && current.every((img, index) => img.getAttribute("src") === layers[index]?.src);
  if (sameSources) {
    current.forEach((img, index) => {
      img.alt = index === 0 ? alt : "";
    });
    return;
  }

  const stack = h("div", { class: "cl-visual__stack is-entering" });
  layers.forEach((layer, index) => {
    const img = h("img", { class: "cl-visual__layer" });
    img.src = layer.src;
    img.width = layer.width;
    img.height = layer.height;
    img.alt = index === 0 ? alt : "";
    img.decoding = "async";
    img.loading = options.lazy ? "lazy" : "eager";
    stack.append(img);
  });
  frame.replaceChildren(stack);
}

/** Double Merle outcomes get a warning panel instead of a puppy image. */
export function renderSafetyPanel(frame: HTMLElement): void {
  if (frame.dataset.renderedKey === "panel:double-merle") return;
  frame.dataset.renderedKey = "panel:double-merle";
  const figure = frame.closest<HTMLElement>("[data-visual]");
  figure?.removeAttribute("data-visual-id");
  const caption = figure?.querySelector<HTMLElement>(".cl-visual__caption");
  if (caption) caption.hidden = true;
  frame.replaceChildren(
    h(
      "div",
      {
        class: "cl-safety-panel",
        attrs: { role: "img", "aria-label": "Double Merle health warning. No puppy image is shown for this outcome." },
      },
      h("span", { class: "cl-safety-panel__mark", text: "!", attrs: { "aria-hidden": "true" } }),
      h("span", { class: "cl-safety-panel__title", text: "Double Merle (M/M)" }),
      h("span", { class: "cl-safety-panel__text", text: "Health warning shown instead of a puppy image." }),
    ),
  );
}
