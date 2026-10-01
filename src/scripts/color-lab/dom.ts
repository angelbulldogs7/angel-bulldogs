type Child = Node | string | null | undefined | false;

interface ElementProps {
  class?: string;
  text?: string;
  attrs?: Record<string, string | undefined>;
}

/** Tiny element builder. Text is always set as text, never parsed as HTML. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps | null = null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props?.class) node.className = props.class;
  if (props?.text !== undefined) node.textContent = props.text;
  if (props?.attrs) {
    for (const [name, value] of Object.entries(props.attrs)) {
      if (value !== undefined) node.setAttribute(name, value);
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}

/** Polite announcement; clearing first lets an identical message be read again. */
export function announce(root: HTMLElement, message: string): void {
  const live = root.querySelector<HTMLElement>("[data-live]");
  if (!live) return;
  live.textContent = "";
  window.setTimeout(() => {
    live.textContent = message;
  }, 40);
}

export function focusHeading(target: HTMLElement | null): void {
  if (!target) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
