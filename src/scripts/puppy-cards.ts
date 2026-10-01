const REDUCED_MOTION_MS = 0.12;

interface GalleryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function headerOffset(): number {
  const header = document.querySelector<HTMLElement>(".site-header");
  return header?.getBoundingClientRect().bottom ?? 0;
}

function parseGallery(card: HTMLElement): GalleryImage[] {
  const raw = card.dataset.gallery;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as GalleryImage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function interactiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "a, button, input, select, textarea, label, video, [data-gallery-controls], [data-gallery-thumb]",
    ),
  );
}

class PuppyCardGallery {
  private index = 0;
  private readonly images: GalleryImage[];
  private readonly main: HTMLImageElement | null;
  private readonly count: HTMLElement | null;
  private readonly thumbs: HTMLButtonElement[];

  constructor(private readonly card: HTMLElement) {
    this.images = parseGallery(card);
    this.main = card.querySelector<HTMLImageElement>(".puppy-card__photo--primary");
    this.count = card.querySelector<HTMLElement>("[data-gallery-count]");
    this.thumbs = Array.from(card.querySelectorAll<HTMLButtonElement>("[data-gallery-thumb]"));
  }

  bind(signal: AbortSignal): void {
    if (this.images.length < 2 || !this.main) return;

    this.card.querySelector("[data-gallery-prev]")?.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();
        this.show(this.index - 1);
      },
      { signal },
    );
    this.card.querySelector("[data-gallery-next]")?.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();
        this.show(this.index + 1);
      },
      { signal },
    );
    this.thumbs.forEach((thumb) => {
      thumb.addEventListener(
        "click",
        (event) => {
          event.stopPropagation();
          const next = Number(thumb.dataset.galleryIndex ?? "0");
          if (Number.isFinite(next)) this.show(next);
        },
        { signal },
      );
    });
  }

  show(next: number): void {
    if (!this.main || this.images.length === 0) return;
    const total = this.images.length;
    this.index = ((next % total) + total) % total;
    const image = this.images[this.index];
    this.main.src = image.src;
    this.main.alt = image.alt;
    this.main.width = image.width;
    this.main.height = image.height;
    if (this.count) this.count.textContent = `${this.index + 1} / ${total}`;
    this.thumbs.forEach((thumb, thumbIndex) => {
      thumb.setAttribute("aria-current", thumbIndex === this.index ? "true" : "false");
    });
  }
}

class PuppyGridController {
  private readonly grid: HTMLElement;
  private readonly cards: HTMLElement[];
  private readonly abort = new AbortController();
  private moveFocus = false;
  private opener: HTMLButtonElement | null = null;

  constructor(grid: HTMLElement) {
    this.grid = grid;
    this.cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-puppy-card]"));
  }

  bind(): void {
    if (this.cards.length === 0) return;

    this.cards.forEach((card) => {
      new PuppyCardGallery(card).bind(this.abort.signal);

      const expandBtn = card.querySelector<HTMLButtonElement>("[data-expand]");
      const collapseBtns = card.querySelectorAll<HTMLButtonElement>("[data-collapse]");

      expandBtn?.addEventListener(
        "click",
        (event) => {
          event.stopPropagation();
          const keyboard = event.detail === 0;
          if (card.classList.contains("is-expanded")) {
            this.go(null, expandBtn, keyboard);
          } else {
            this.go(card, expandBtn, keyboard);
          }
        },
        { signal: this.abort.signal },
      );

      collapseBtns.forEach((button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();
            this.go(null, expandBtn, false);
          },
          { signal: this.abort.signal },
        );
      });

      card.addEventListener(
        "click",
        (event) => {
          if (interactiveTarget(event.target)) return;
          if (card.classList.contains("is-expanded")) return;
          this.go(card, expandBtn, false);
        },
        { signal: this.abort.signal },
      );

      card.addEventListener(
        "keydown",
        (event) => {
          if (event.key !== "Escape") return;
          if (!card.classList.contains("is-expanded")) return;
          event.preventDefault();
          this.go(null, expandBtn, true);
        },
        { signal: this.abort.signal },
      );
    });

    document.addEventListener("astro:page-load", this.dispose, { signal: this.abort.signal });
  }

  private dispose = (): void => {
    if (!this.grid.isConnected) this.abort.abort();
  };

  private parts(card: HTMLElement): {
    trigger: HTMLButtonElement | null;
    panel: HTMLElement | null;
    name: string;
  } {
    return {
      trigger: card.querySelector<HTMLButtonElement>("[data-expand]"),
      panel: card.querySelector<HTMLElement>("[data-panel]"),
      name: card.dataset.puppyName ?? "this puppy",
    };
  }

  private setTriggerState(card: HTMLElement, expanded: boolean): void {
    const { trigger, name } = this.parts(card);
    if (!trigger) return;
    trigger.setAttribute("aria-expanded", expanded ? "true" : "false");
    trigger.setAttribute(
      "aria-label",
      expanded ? `Hide details for ${name}` : `View details for ${name}`,
    );
    const label = trigger.querySelector("[data-expand-label]");
    if (label) label.textContent = expanded ? "Hide details" : "View details";
  }

  private pauseMedia(card: HTMLElement): void {
    card.querySelectorAll("video").forEach((video) => video.pause());
  }

  private applyExpanded(card: HTMLElement): void {
    const { panel } = this.parts(card);
    card.classList.add("is-expanded");
    this.setTriggerState(card, true);
    if (!panel) return;
    panel.hidden = false;
    panel.inert = false;
  }

  private applyCollapsed(card: HTMLElement): void {
    const { panel } = this.parts(card);
    card.classList.remove("is-expanded");
    this.setTriggerState(card, false);
    this.pauseMedia(card);
    if (!panel) return;
    panel.hidden = true;
    panel.inert = true;
  }

  private settleThen(card: HTMLElement, run: () => void): void {
    let lastHeight = -1;
    let stable = 0;
    let frames = 0;
    const maxFrames = 36;

    const tick = () => {
      frames += 1;
      const height = card.getBoundingClientRect().height;
      if (Math.abs(height - lastHeight) < 1) stable += 1;
      else {
        stable = 0;
        lastHeight = height;
      }

      if (stable >= 2 || frames >= maxFrames) {
        run();
        return;
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  private bringIntoView(card: HTMLElement): void {
    const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";

    // Document order keeps earlier (left) cards above and later (right) cards
    // below once the opened card spans the full grid row. Wait for that reflow,
    // then keep the opened details centered in the visible viewport.
    this.settleThen(card, () => {
      const rect = card.getBoundingClientRect();
      const header = headerOffset();
      const gutter = 16;
      const available = Math.max(window.innerHeight - header, 1);
      const cardCenter = rect.top + rect.height / 2;
      const viewCenter = header + available / 2;
      let delta = cardCenter - viewCenter;

      // Never tuck the top of the opened card under the sticky header.
      const minTop = header + gutter;
      if (rect.top - delta < minTop) {
        delta = rect.top - minTop;
      }

      if (Math.abs(delta) >= 4) {
        window.scrollBy({ top: delta, behavior });
      }
    });
  }

  private go(
    next: HTMLElement | null,
    opener: HTMLButtonElement | null,
    moveFocus: boolean,
  ): void {
    this.opener = opener;
    this.moveFocus = moveFocus;

    this.cards.forEach((card) => {
      if (card === next) this.applyExpanded(card);
      else this.applyCollapsed(card);
    });

    if (next) {
      this.bringIntoView(next);
      const panel = this.parts(next).panel;
      if (this.moveFocus) {
        window.setTimeout(() => panel?.focus({ preventScroll: true }), REDUCED_MOTION_MS);
      }
      return;
    }

    this.opener?.focus({ preventScroll: true });
  }
}

export function initPuppyCards(): void {
  const grids = document.querySelectorAll<HTMLElement>("[data-puppy-grid]");
  grids.forEach((grid) => {
    if (grid.dataset.puppyInit === "true") return;
    grid.dataset.puppyInit = "true";
    new PuppyGridController(grid).bind();
  });
}

initPuppyCards();
document.addEventListener("astro:page-load", initPuppyCards);
