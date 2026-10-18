function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

class BellaSerbiaVideo {
  private readonly root: HTMLElement;
  private readonly video: HTMLVideoElement;
  private readonly toggle: HTMLButtonElement;
  private userPaused = false;
  private activated = false;

  constructor(root: HTMLElement, video: HTMLVideoElement, toggle: HTMLButtonElement) {
    this.root = root;
    this.video = video;
    this.toggle = toggle;
    this.prepareVideo();
    this.bind();
    this.syncToggle();
  }

  private prepareVideo(): void {
    this.video.defaultMuted = true;
    this.video.muted = true;
    this.video.loop = true;
    this.video.playsInline = true;
    this.video.preload = "none";
    this.video.removeAttribute("controls");
    this.video.setAttribute("muted", "");
    this.video.setAttribute("playsinline", "");
    this.video.setAttribute("webkit-playsinline", "");
  }

  private bind(): void {
    this.toggle.addEventListener("click", () => {
      if (this.video.paused) {
        this.userPaused = false;
        void this.play();
      } else {
        this.userPaused = true;
        this.video.pause();
        this.syncToggle();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.video.pause();
        this.syncToggle();
        return;
      }
      if (!this.userPaused && !prefersReducedMotion() && this.isNearViewport()) {
        void this.play();
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          if (!this.userPaused && !prefersReducedMotion()) {
            void this.play();
          }
        } else {
          this.video.pause();
        }
        this.syncToggle();
      },
      { rootMargin: "120px 0px", threshold: 0.15 },
    );
    observer.observe(this.root);
  }

  private isNearViewport(): boolean {
    const rect = this.root.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }

  private async play(): Promise<void> {
    this.video.defaultMuted = true;
    this.video.muted = true;
    if (!this.activated) {
      this.video.preload = "metadata";
      this.activated = true;
    }
    try {
      await this.video.play();
    } catch {
      // Keep poster layout if autoplay is blocked.
    }
    this.syncToggle();
  }

  private syncToggle(): void {
    const playing = !this.video.paused && !this.video.ended;
    this.toggle.hidden = false;
    this.toggle.setAttribute("aria-pressed", playing ? "true" : "false");
    this.toggle.textContent = playing ? "Pause motion" : "Resume motion";
  }
}

export function initBellaSerbiaVideo(scope: ParentNode = document): void {
  scope.querySelectorAll<HTMLElement>("[data-bella-serbia]").forEach((root) => {
    if (root.dataset.bellaSerbiaInit === "true") return;
    root.dataset.bellaSerbiaInit = "true";

    const video = root.querySelector<HTMLVideoElement>("[data-bella-serbia-video]");
    const toggle = root.querySelector<HTMLButtonElement>("[data-bella-serbia-motion]");
    if (!video || !toggle) return;

    new BellaSerbiaVideo(root, video, toggle);
  });
}

if (typeof document !== "undefined") {
  initBellaSerbiaVideo();
}
