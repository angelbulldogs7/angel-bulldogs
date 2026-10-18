interface GalleryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function parseGallery(root: HTMLElement): GalleryImage[] {
  const raw = root.dataset.gallery;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as GalleryImage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export class PuppyGallery {
  private index = 0;
  private requestToken = 0;
  private readonly images: GalleryImage[];
  private readonly main: HTMLImageElement | null;
  private readonly count: HTMLElement | null;
  private readonly thumbs: HTMLButtonElement[];
  private readonly thumbList: HTMLElement | null;

  constructor(private readonly root: HTMLElement) {
    this.images = parseGallery(root);
    this.main = root.querySelector<HTMLImageElement>("[data-gallery-main]");
    this.count = root.querySelector<HTMLElement>("[data-gallery-count]");
    this.thumbs = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-gallery-thumb]"));
    this.thumbList = root.querySelector<HTMLElement>("[data-gallery-thumbs]");
  }

  bind(signal: AbortSignal): void {
    if (this.images.length < 2 || !this.main) return;

    this.root.querySelector("[data-gallery-prev]")?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        this.show(this.index - 1);
      },
      { signal },
    );
    this.root.querySelector("[data-gallery-next]")?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        this.show(this.index + 1);
      },
      { signal },
    );
    this.thumbs.forEach((thumb) => {
      thumb.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
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
    const target = ((next % total) + total) % total;
    const image = this.images[target];
    const token = ++this.requestToken;

    const apply = () => {
      if (token !== this.requestToken || !this.main) return;
      this.index = target;
      this.main.src = image.src;
      this.main.alt = image.alt;
      this.main.width = image.width;
      this.main.height = image.height;
      if (this.count) this.count.textContent = `${this.index + 1} / ${total}`;
      this.thumbs.forEach((thumb, thumbIndex) => {
        const selected = thumbIndex === this.index;
        thumb.setAttribute("aria-current", selected ? "true" : "false");
        thumb.classList.toggle("is-selected", selected);
      });
      this.scrollThumbIntoView();
    };

    // Keep the current image visible until the next one is ready.
    const probe = new Image();
    probe.decoding = "async";
    probe.onload = () => {
      if (token !== this.requestToken) return;
      if (prefersReducedMotion()) {
        apply();
        return;
      }
      apply();
    };
    probe.onerror = () => {
      // Leave selection and visible image unchanged on load failure.
      if (token !== this.requestToken) return;
    };
    probe.src = image.src;
    if (probe.complete) apply();
  }

  private scrollThumbIntoView(): void {
    const thumb = this.thumbs[this.index];
    if (!thumb || !this.thumbList) return;
    const listRect = this.thumbList.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    if (thumbRect.left < listRect.left || thumbRect.right > listRect.right) {
      thumb.scrollIntoView({ inline: "nearest", block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }
}

export function initPuppyGalleries(scope: ParentNode = document): void {
  const roots = scope.querySelectorAll<HTMLElement>("[data-puppy-gallery]");
  roots.forEach((root) => {
    if (root.dataset.galleryInit === "true") return;
    root.dataset.galleryInit = "true";
    const abort = new AbortController();
    new PuppyGallery(root).bind(abort.signal);
    document.addEventListener(
      "astro:page-load",
      () => {
        if (!root.isConnected) abort.abort();
      },
      { signal: abort.signal },
    );
  });
}

initPuppyGalleries();
document.addEventListener("astro:page-load", () => initPuppyGalleries());
