export const COLOR_LAB_PLACEHOLDER_SRC = "/images/color-lab/coming-soon.svg";
export const COLOR_LAB_IMAGE_WIDTH = 800;
export const COLOR_LAB_IMAGE_HEIGHT = 1000;

/** Photorealistic assets are not generated in this phase. Add slugs here when files exist. */
export const AVAILABLE_PHENOTYPE_ASSETS = new Set<string>([]);

export interface PhenotypeImage {
  id: string;
  src: string;
  width: number;
  height: number;
  available: boolean;
  alt: string;
}

export function phenotypeAssetPath(imageId: string): string {
  return `/images/color-lab/phenotypes/${imageId}.webp`;
}

export function getPhenotypeImage(imageId: string, commonName: string): PhenotypeImage {
  const available = AVAILABLE_PHENOTYPE_ASSETS.has(imageId);
  return {
    id: imageId,
    src: available ? phenotypeAssetPath(imageId) : COLOR_LAB_PLACEHOLDER_SRC,
    width: COLOR_LAB_IMAGE_WIDTH,
    height: COLOR_LAB_IMAGE_HEIGHT,
    available,
    alt: available
      ? `Representative ${commonName} French Bulldog puppy. Studio image, not a prediction of an individual dog.`
      : `Image coming soon for a representative ${commonName} French Bulldog puppy.`,
  };
}
