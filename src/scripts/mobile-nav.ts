function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("hidden") && el.tabIndex >= 0);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function initMobileNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const drawer = document.querySelector<HTMLElement>("[data-nav-drawer]");
  const overlay = document.querySelector<HTMLElement>("[data-nav-overlay]");
  const closeBtn = document.querySelector<HTMLButtonElement>("[data-nav-close]");
  if (!toggle || !drawer || !overlay) return;
  if (drawer.dataset.navInit === "true") return;
  drawer.dataset.navInit = "true";

  let lastFocus: HTMLElement | null = null;
  let scrollY = 0;
  let closing = false;
  let closeFallback: number | null = null;

  const isOpen = () => drawer.classList.contains("is-open") && !closing;

  const clearCloseFallback = () => {
    if (closeFallback !== null) {
      window.clearTimeout(closeFallback);
      closeFallback = null;
    }
  };

  const unlockScroll = () => {
    document.body.classList.remove("nav-open");
    document.body.style.removeProperty("top");
    document.body.style.removeProperty("position");
    document.body.style.removeProperty("width");
    window.scrollTo(0, scrollY);
  };

  const lockScroll = () => {
    scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.classList.add("nav-open");
  };

  const finishClose = () => {
    clearCloseFallback();
    closing = false;
    drawer.classList.remove("is-closing");
    overlay.classList.remove("is-closing");
    overlay.setAttribute("hidden", "");
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    unlockScroll();
    const restore = lastFocus?.isConnected ? lastFocus : toggle;
    restore.focus({ preventScroll: true });
  };

  const open = () => {
    clearCloseFallback();
    if (closing) {
      drawer.classList.remove("is-closing");
      overlay.classList.remove("is-closing");
      closing = false;
    }
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    overlay.removeAttribute("hidden");
    drawer.removeAttribute("aria-hidden");
    drawer.inert = false;
    // Force layout so the open transition runs from the closed transform.
    void drawer.offsetWidth;
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    lockScroll();
    const firstNav = drawer.querySelector<HTMLElement>("nav a");
    (firstNav ?? closeBtn ?? drawer).focus({ preventScroll: true });
  };

  const close = () => {
    if (!drawer.classList.contains("is-open") || closing) return;
    closing = true;
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    drawer.classList.add("is-closing");
    overlay.classList.add("is-closing");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");

    if (prefersReducedMotion()) {
      finishClose();
      return;
    }

    let ended = false;
    const onEnd = (event: TransitionEvent) => {
      if (event.target !== drawer) return;
      if (event.propertyName !== "transform" && event.propertyName !== "visibility") return;
      if (ended) return;
      ended = true;
      drawer.removeEventListener("transitionend", onEnd);
      finishClose();
    };
    drawer.addEventListener("transitionend", onEnd);
    clearCloseFallback();
    closeFallback = window.setTimeout(() => {
      drawer.removeEventListener("transitionend", onEnd);
      finishClose();
    }, 400);
  };

  toggle.addEventListener("click", () => (isOpen() ? close() : open()));
  closeBtn?.addEventListener("click", close);
  overlay.addEventListener("click", close);

  drawer.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    link.addEventListener("click", () => {
      if (isOpen()) close();
    });
  });

  drawer.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab" || !isOpen()) return;
    const focusable = getFocusable(drawer);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) close();
  });

  window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
    if (event.matches && (isOpen() || closing)) {
      clearCloseFallback();
      drawer.classList.remove("is-open", "is-closing");
      overlay.classList.remove("is-open", "is-closing");
      overlay.setAttribute("hidden", "");
      drawer.setAttribute("aria-hidden", "true");
      drawer.inert = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      closing = false;
      unlockScroll();
    }
  });
}

/**
 * Publish sticky header height for skip/fragment scroll offsets.
 * Never write this value into styles that change the header's own size
 * (that creates an infinite ResizeObserver growth loop).
 */
function syncHeaderOffset(): void {
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  if (!header) return;
  if (header.dataset.headerOffsetInit === "true") {
    // Still refresh once after navigation; observer already attached.
    const height = Math.ceil(header.getBoundingClientRect().height);
    if (height > 0) {
      document.documentElement.style.setProperty("--header-h", `${height}px`);
    }
    return;
  }
  header.dataset.headerOffsetInit = "true";

  const apply = () => {
    const height = Math.ceil(header.getBoundingClientRect().height);
    if (height <= 0) return;
    document.documentElement.style.setProperty("--header-h", `${height}px`);
  };

  apply();
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(apply);
    observer.observe(header);
  }
  window.addEventListener("resize", apply);
}

initMobileNav();
syncHeaderOffset();
document.addEventListener("astro:page-load", () => {
  initMobileNav();
  syncHeaderOffset();
});
