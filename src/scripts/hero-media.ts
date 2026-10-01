type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

export function initHeroMedia(): void {
  const root = document.querySelector<HTMLElement>("[data-hero-media]");
  if (!root) return;
  const video = root.querySelector<HTMLVideoElement>("video");
  const poster = root.querySelector<HTMLImageElement>("[data-hero-poster]");
  if (!video) return;

  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const smallScreen = window.matchMedia("(max-width: 700px)").matches;
  const slow =
    connection?.saveData === true ||
    connection?.effectiveType === "2g" ||
    connection?.effectiveType === "slow-2g";

  if (reduceMotion || smallScreen || slow) {
    video.removeAttribute("autoplay");
    video.pause();
    video.setAttribute("hidden", "");
    poster?.removeAttribute("hidden");
  }
}

initHeroMedia();
