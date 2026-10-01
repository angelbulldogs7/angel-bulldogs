import type { ApprovedAsset, VisualBase } from "../../lib/color-lab/types";

export const COLOR_LAB_ASSET_LIBRARY_VERSION = "2.0.0";
export const VISUAL_WIDTH = 800;
export const VISUAL_HEIGHT = 1000;
export const COMING_SOON_SRC = "/images/color-lab/coming-soon.svg";

export const VISUAL_DISCLOSURE =
  "AI-generated representative visualization. Real shade, marking placement, coat texture, eyes, and markings vary.";

/**
 * Anchors carry the permanent puppy identity and pose. The standard anchor must be the
 * approved corrected no-white Solid master; Solid recipes never add a white-marking layer.
 */
export const ANCHORS: Readonly<
  Record<VisualBase, { readonly role: string; readonly expectedMasterFile: string | null }>
> = {
  standard: {
    role: "Approved permanent identity — corrected no-white Solid master",
    expectedMasterFile: "classic-fawn-solid-master-v2.png",
  },
  fluffy: { role: "Approved natural Fluffy anchor", expectedMasterFile: null },
  hairless: { role: "Corrected viable Hairless anchor", expectedMasterFile: null },
};

/**
 * Approved web layers keyed by layer ID (see `requiredLayers`). Add an entry only after the
 * reviewed file exists under /public. Paths are never built from visitor input.
 */
export const APPROVED_LAYERS: Readonly<Record<string, ApprovedAsset | undefined>> = {};

/** Approved pre-composited images keyed by visual slug. Used instead of layers when present. */
export const APPROVED_DERIVATIVES: Readonly<Record<string, ApprovedAsset | undefined>> = {};

/** Where a web layer is expected to live once approved. Used for the manifest only. */
export function expectedLayerFile(layerId: string): string {
  return `public/images/color-lab/layers/${layerId}.webp`;
}
