function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("hidden") && el.tabIndex >= 0);
}

export function initMobileNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const drawer = document.querySelector<HTMLElement>("[data-nav-drawer]");
  const overlay = document.querySelector<HTMLElement>("[data-nav-overlay]");
  const closeBtn = document.querySelector<HTMLButtonElement>("[data-nav-close]");
  if (!toggle || !drawer || !overlay) return;

  let lastFocus: HTMLElement | null = null;

  const isOpen = () => drawer.classList.contains("is-open");

  const open = () => {
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    overlay.removeAttribute("hidden");
    drawer.removeAttribute("aria-hidden");
    drawer.inert = false;
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
    const firstNav = drawer.querySelector<HTMLElement>("nav a");
    (firstNav ?? closeBtn ?? drawer).focus();
  };

  const close = () => {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    overlay.setAttribute("hidden", "");
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    (lastFocus ?? toggle).focus();
  };

  toggle.addEventListener("click", () => (isOpen() ? close() : open()));
  closeBtn?.addEventListener("click", close);
  overlay.addEventListener("click", close);

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
    if (event.matches && isOpen()) close();
  });
}

initMobileNav();
