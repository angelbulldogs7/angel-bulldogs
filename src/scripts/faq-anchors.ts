import { resolveFaqDetails } from "../lib/faqAnchors";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollFaqIntoView(item: HTMLDetailsElement): void {
  item.scrollIntoView({
    block: "start",
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}

/**
 * Open a linked FAQ disclosure and place it below the sticky header.
 * Uses --header-h via CSS scroll-margin on .faq-item (same convention as puppy cards).
 */
function activateFaqFromHash(hash: string | null | undefined): void {
  const item = resolveFaqDetails(hash, document);
  if (!item) return;

  item.open = true;

  // Open first so the expanded height is included; then adjust scroll once.
  requestAnimationFrame(() => {
    scrollFaqIntoView(item);
    const summary = item.querySelector("summary");
    if (summary instanceof HTMLElement) {
      summary.focus({ preventScroll: true });
    }
  });
}

function onHashChange(): void {
  activateFaqFromHash(window.location.hash);
}

function initFaqAnchors(): void {
  if (!document.querySelector("details.faq-item")) return;

  // Document-level listeners once; re-run activation after each page load / hash change.
  if (document.documentElement.dataset.faqAnchorsInit !== "true") {
    document.documentElement.dataset.faqAnchorsInit = "true";
    window.addEventListener("hashchange", onHashChange);
  }

  activateFaqFromHash(window.location.hash);
}

initFaqAnchors();
document.addEventListener("astro:page-load", initFaqAnchors);
