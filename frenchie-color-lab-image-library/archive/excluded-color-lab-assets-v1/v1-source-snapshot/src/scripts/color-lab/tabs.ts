export function initTabs(root: HTMLElement, tablistSelector: string): void {
  const tablist = root.querySelector<HTMLElement>(tablistSelector);
  if (!tablist) return;
  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'));

  function activate(next: HTMLButtonElement, focus = false): void {
    for (const tab of tabs) {
      const selected = tab === next;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      tab.tabIndex = selected ? 0 : -1;
      const panelId = tab.getAttribute("aria-controls");
      const panel = panelId ? root.querySelector<HTMLElement>(`#${panelId}`) : null;
      if (panel) panel.hidden = !selected;
    }
    if (focus) next.focus();
  }

  tablist.addEventListener("click", (event) => {
    const tab = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('[role="tab"]');
    if (!tab || !tabs.includes(tab)) return;
    activate(tab);
  });

  tablist.addEventListener("keydown", (event) => {
    const current = document.activeElement as HTMLButtonElement | null;
    if (!current || !tabs.includes(current)) return;
    const index = tabs.indexOf(current);
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      activate(tabs[(index + 1) % tabs.length], true);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      activate(tabs[(index - 1 + tabs.length) % tabs.length], true);
    } else if (event.key === "Home") {
      event.preventDefault();
      activate(tabs[0], true);
    } else if (event.key === "End") {
      event.preventDefault();
      activate(tabs[tabs.length - 1], true);
    }
  });
}
