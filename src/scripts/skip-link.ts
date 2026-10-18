/** Move keyboard focus to #main when the skip link is activated. */
function initSkipLink(): void {
  const skip = document.querySelector<HTMLAnchorElement>("a.skip-link");
  const main = document.getElementById("main");
  if (!skip || !main) return;
  if (skip.dataset.skipInit === "true") return;
  skip.dataset.skipInit = "true";

  skip.addEventListener("click", (event) => {
    const href = skip.getAttribute("href");
    if (href !== "#main") return;
    event.preventDefault();
    main.focus({ preventScroll: false });
    main.scrollIntoView({ block: "start" });
    history.replaceState(null, "", "#main");
  });
}

initSkipLink();
document.addEventListener("astro:page-load", initSkipLink);
