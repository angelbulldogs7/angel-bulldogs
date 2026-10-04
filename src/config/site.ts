export interface NavItem {
  href: string;
  label: string;
}

export interface SiteConfig {
  name: string;
  location: string;
  locationShort: string;
  serviceArea: string;
  /**
   * Public email. Leave empty until a verified address is supplied.
   * An empty value must never render as a believable address.
   */
  email: string;
  /**
   * Public hostname without protocol, e.g. "angelbulldogs.com".
   * Leave empty until verified — do not invent a domain.
   */
  domain: string;
  /** Path under /public. Empty/null skips the <video> element entirely. */
  heroVideo: string | null;
  heroPoster: string;
  ogImage: string;
  socialLinks: Record<string, never>;
  prototypeMode: boolean;
  /** Site-wide top banner: website still in development. */
  siteInDevelopment: boolean;
  /**
   * When true, /color-lab stays in the nav but shows Coming Soon.
   * Full Color Lab source stays in the repo — flip to false to restore the tool.
   */
  colorLabComingSoon: boolean;
  nav: readonly NavItem[];
}

export const siteConfig = {
  name: "Angel Bulldogs",
  location: "Chicago, Illinois",
  locationShort: "Chicago-based",
  serviceArea: "Nationwide delivery available",
  email: "angelbulldogs7@gmail.com",
  domain: "angelbulldogs.com",
  // TODO: Add a compressed muted hero video path (e.g. "/media/hero-bella.mp4") when the file exists.
  // Recommended: H.264, 1920×1080 or 1600×900, under ~4 MB, no audio track.
  heroVideo: null,
  heroPoster: "/placeholders/hero-bella-poster.svg",
  ogImage: "/placeholders/og-share.svg",
  socialLinks: {},
  /**
   * While true, no form sends anything. Live delivery also needs the matching
   * PUBLIC_FORMSPREE_* / PUBLIC_BREVO_* endpoints at build time.
   */
  prototypeMode: false,
  siteInDevelopment: false,
  /** Keep Coming Soon until Color Lab images are approved; endpoint can still be set. */
  colorLabComingSoon: true,
  nav: [
    { href: "/", label: "Home" },
    { href: "/puppies", label: "Available Puppies" },
    { href: "/color-lab", label: "Color Lab" },
    { href: "/bella", label: "Meet Bella" },
    { href: "/application", label: "Puppy Inquiry" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ],
} as const satisfies SiteConfig;

/** Public pricing copy — no verified public price list exists in site data. */
export const PRICE_LABEL =
  "Pricing varies by puppy. We'll confirm the price and any delivery costs in our first personal reply.";

export function getPublicEmail(): {
  address: string | null;
  notice: string;
} {
  const trimmed = siteConfig.email.trim();
  if (!trimmed) {
    return {
      address: null,
      notice: "Add public email in src/config/site.ts",
    };
  }
  return { address: trimmed, notice: "" };
}

export function getSiteOrigin(): string | null {
  const domain = siteConfig.domain.trim();
  if (!domain) return null;
  return `https://${domain}`;
}
