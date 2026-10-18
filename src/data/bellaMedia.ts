/** Bella photo-story media. Generated from docs/bella-media-inventory.json — re-run scripts/export-bella-media.py after source changes. */

export type BellaAlbumId = "younger-days" | "little-celebrations" | "everyday" | "serbia";

export type BellaMediaRole =
  | "album"
  | "preview"
  | "story-portrait"
  | "homepage-portrait"
  | "homepage-support"
  | "existing"
  | "legacy-portrait"
  | "video";

export interface BellaImageAsset {
  src: string;
  width: number;
  height: number;
}

export interface BellaPhotoItem {
  id: string;
  kind: "photo";
  album: BellaAlbumId;
  order: number;
  caption: string;
  alt: string;
  roles: BellaMediaRole[];
  preview: BellaImageAsset;
  viewer: BellaImageAsset;
}

export interface BellaVideoItem {
  id: string;
  kind: "video";
  album: BellaAlbumId;
  order: number;
  caption: string;
  alt: string;
  roles: BellaMediaRole[];
  video: BellaImageAsset & { duration: number };
  poster: BellaImageAsset;
}

export type BellaMediaItem = BellaPhotoItem | BellaVideoItem;

export interface BellaAlbum {
  id: BellaAlbumId;
  title: string;
  intro: string;
  items: BellaMediaItem[];
}

export const bellaMediaItems: BellaMediaItem[] = [
  {
    id: "Y03",
    kind: "photo",
    album: "younger-days",
    order: 1,
    caption: "Sitting as a puppy",
    alt: "Young Bella sitting on a rug and looking toward the camera",
    roles: ["album", "preview"],
    preview: { src: "/images/bella/v6-y03-sitting-11271680-sm.jpg", width: 506, height: 900 },
    viewer: { src: "/images/bella/v6-y03-sitting-11271680.jpg", width: 1012, height: 1800 },
  },
  {
    id: "Y05",
    kind: "photo",
    album: "younger-days",
    order: 2,
    caption: "Belly rubs",
    alt: "Young Bella on her back enjoying belly rubs",
    roles: ["album", "preview"],
    preview: { src: "/images/bella/v6-y05-belly-rubs-83603c1f-sm.jpg", width: 506, height: 900 },
    viewer: { src: "/images/bella/v6-y05-belly-rubs-83603c1f.jpg", width: 1012, height: 1800 },
  },
  {
    id: "Y07",
    kind: "photo",
    album: "younger-days",
    order: 3,
    caption: "A quiet nap",
    alt: "Young Bella sleeping with her head and front paws visible",
    roles: ["album", "preview"],
    preview: { src: "/images/bella/v6-y07-sleeping-close-3369b366-sm.jpg", width: 414, height: 900 },
    viewer: { src: "/images/bella/v6-y07-sleeping-close-3369b366.jpg", width: 829, height: 1800 },
  },
  {
    id: "Y01",
    kind: "photo",
    album: "younger-days",
    order: 4,
    caption: "Early portrait",
    alt: "Young Bella sitting and looking toward the camera",
    roles: ["album", "homepage-support"],
    preview: { src: "/images/bella/v6-y01-young-portrait-6bfb9bf3-sm.jpg", width: 675, height: 900 },
    viewer: { src: "/images/bella/v6-y01-young-portrait-6bfb9bf3.jpg", width: 768, height: 1024 },
  },
  {
    id: "Y04",
    kind: "photo",
    album: "younger-days",
    order: 5,
    caption: "In the sunlight",
    alt: "A hand gently holding young Bella's head in sunlight",
    roles: ["album"],
    preview: { src: "/images/bella/v6-y04-sunlight-hands-d1681fe7-sm.jpg", width: 506, height: 900 },
    viewer: { src: "/images/bella/v6-y04-sunlight-hands-d1681fe7.jpg", width: 1012, height: 1800 },
  },
  {
    id: "Y02",
    kind: "photo",
    album: "younger-days",
    order: 6,
    caption: "Lying down",
    alt: "Young Bella lying down on a soft blanket",
    roles: ["album"],
    preview: { src: "/images/bella/v6-y02-lying-down-e82c314f-sm.jpg", width: 506, height: 900 },
    viewer: { src: "/images/bella/v6-y02-lying-down-e82c314f.jpg", width: 1012, height: 1800 },
  },
  {
    id: "Y06",
    kind: "photo",
    album: "younger-days",
    order: 7,
    caption: "On the floor",
    alt: "Young Bella sitting on the floor farther from the camera",
    roles: ["album"],
    preview: { src: "/images/bella/v6-y06-sitting-farther-b01a41b4-sm.jpg", width: 675, height: 900 },
    viewer: { src: "/images/bella/v6-y06-sitting-farther-b01a41b4.jpg", width: 1350, height: 1800 },
  },
  {
    id: "C01",
    kind: "photo",
    album: "little-celebrations",
    order: 1,
    caption: "Her first birthday",
    alt: "Bella wearing a birthday cap and looking at a small cake",
    roles: ["album", "preview"],
    preview: { src: "/images/bella/v6-c01-first-birthday-a4eb019f-sm.jpg", width: 506, height: 900 },
    viewer: { src: "/images/bella/v6-c01-first-birthday-a4eb019f.jpg", width: 1012, height: 1800 },
  },
  {
    id: "N01",
    kind: "photo",
    album: "little-celebrations",
    order: 2,
    caption: "New Year's memories",
    alt: "Bella outdoors in the snow wearing a sweater",
    roles: ["album", "preview"],
    preview: { src: "/images/bella/v6-n01-snow-sweater-249c648a-sm.jpg", width: 675, height: 900 },
    viewer: { src: "/images/bella/v6-n01-snow-sweater-249c648a.jpg", width: 1350, height: 1800 },
  },
  {
    id: "N02",
    kind: "photo",
    album: "little-celebrations",
    order: 3,
    caption: "By the Christmas tree",
    alt: "Bella sitting in side profile beside a Christmas tree",
    roles: ["album"],
    preview: { src: "/images/bella/v6-n02-christmas-tree-cf0c7016-sm.jpg", width: 675, height: 900 },
    viewer: { src: "/images/bella/v6-n02-christmas-tree-cf0c7016.jpg", width: 1350, height: 1800 },
  },
  {
    id: "N03",
    kind: "photo",
    album: "little-celebrations",
    order: 4,
    caption: "Asleep by the tree",
    alt: "Bella sleeping beside a Christmas tree",
    roles: ["album"],
    preview: { src: "/images/bella/v6-n03-asleep-by-tree-12e5ffa7-sm.jpg", width: 675, height: 900 },
    viewer: { src: "/images/bella/v6-n03-asleep-by-tree-12e5ffa7.jpg", width: 1350, height: 1800 },
  },
  {
    id: "E05",
    kind: "photo",
    album: "everyday",
    order: 1,
    caption: "Sunlit portrait",
    alt: "Bella looking toward the camera in bright outdoor light",
    roles: ["album", "preview", "story-portrait", "homepage-portrait"],
    preview: { src: "/images/bella/v6-e05-sunlit-portrait-4a0adc10-sm.jpg", width: 675, height: 900 },
    viewer: { src: "/images/bella/v6-e05-sunlit-portrait-4a0adc10.jpg", width: 1350, height: 1800 },
  },
  {
    id: "E03",
    kind: "photo",
    album: "everyday",
    order: 2,
    caption: "With Seb",
    alt: "Bella and Seb on the grass looking toward the camera",
    roles: ["album", "preview", "homepage-support"],
    preview: { src: "/images/bella/v6-e03-with-seb-aee852e8-sm.jpg", width: 761, height: 900 },
    viewer: { src: "/images/bella/v6-e03-with-seb-aee852e8.jpg", width: 1240, height: 1466 },
  },
  {
    id: "X01",
    kind: "photo",
    album: "everyday",
    order: 3,
    caption: "At home",
    alt: "Bella sitting on her bed at home",
    roles: ["album", "existing"],
    preview: { src: "/images/bella/v5-lifestyle.jpg", width: 1200, height: 800 },
    viewer: { src: "/images/bella/v5-lifestyle.jpg", width: 1200, height: 800 },
  },
  {
    id: "E01",
    kind: "photo",
    album: "everyday",
    order: 4,
    caption: "On a walk",
    alt: "Bella on a walk licking her nose",
    roles: ["album"],
    preview: { src: "/images/bella/v6-e01-walk-nose-lick-49afba06-sm.jpg", width: 579, height: 900 },
    viewer: { src: "/images/bella/v6-e01-walk-nose-lick-49afba06.jpg", width: 1158, height: 1800 },
  },
  {
    id: "X02",
    kind: "photo",
    album: "everyday",
    order: 5,
    caption: "Family time",
    alt: "Bella at home interacting with her family",
    roles: ["album", "existing"],
    preview: { src: "/images/bella/v5-home-01.jpg", width: 1200, height: 800 },
    viewer: { src: "/images/bella/v5-home-01.jpg", width: 1200, height: 800 },
  },
  {
    id: "E02",
    kind: "photo",
    album: "everyday",
    order: 6,
    caption: "Sunset nap",
    alt: "Bella sleeping on a bed in warm sunset light",
    roles: ["album", "preview"],
    preview: { src: "/images/bella/v6-e02-sunset-nap-8cb6edc3-sm.jpg", width: 506, height: 900 },
    viewer: { src: "/images/bella/v6-e02-sunset-nap-8cb6edc3.jpg", width: 1012, height: 1800 },
  },
  {
    id: "X03",
    kind: "photo",
    album: "everyday",
    order: 7,
    caption: "On her bed",
    alt: "Bella standing in profile on her bed",
    roles: ["album", "existing"],
    preview: { src: "/images/bella/v5-home-02.jpg", width: 1200, height: 800 },
    viewer: { src: "/images/bella/v5-home-02.jpg", width: 1200, height: 800 },
  },
  {
    id: "E04",
    kind: "photo",
    album: "everyday",
    order: 8,
    caption: "A walk outside",
    alt: "Bella smiling toward the camera during a walk",
    roles: ["album"],
    preview: { src: "/images/bella/v6-e04-walk-smile-e0538f6a-sm.jpg", width: 675, height: 900 },
    viewer: { src: "/images/bella/v6-e04-walk-smile-e0538f6a.jpg", width: 1350, height: 1800 },
  },
  {
    id: "X04",
    kind: "photo",
    album: "everyday",
    order: 9,
    caption: "Looking up",
    alt: "Bella standing and looking upward on her bed",
    roles: ["album", "existing"],
    preview: { src: "/images/bella/v5-home-03.jpg", width: 1200, height: 800 },
    viewer: { src: "/images/bella/v5-home-03.jpg", width: 1200, height: 800 },
  },
  {
    id: "X05",
    kind: "photo",
    album: "everyday",
    order: 10,
    caption: "Earlier portrait",
    alt: "Bella looking up at the camera from her bed",
    roles: ["album", "existing", "legacy-portrait"],
    preview: { src: "/images/bella/v6-x05-portrait-unmatted-sm.jpg", width: 900, height: 600 },
    viewer: { src: "/images/bella/v6-x05-portrait-unmatted.jpg", width: 1800, height: 1200 },
  },
  {
    id: "X06",
    kind: "photo",
    album: "everyday",
    order: 11,
    caption: "Close at home",
    alt: "Bella looking up toward the camera at home",
    roles: ["album", "existing"],
    preview: { src: "/images/bella/v5-home-04.jpg", width: 1200, height: 800 },
    viewer: { src: "/images/bella/v5-home-04.jpg", width: 1200, height: 800 },
  },
  {
    id: "S01",
    kind: "photo",
    album: "serbia",
    order: 1,
    caption: "A moment in Serbia",
    alt: "Bella looking toward a monastery, with her ears in the foreground",
    roles: ["album", "preview"],
    preview: { src: "/images/bella/v6-s01-monastery-photo-bad7bb44-sm.jpg", width: 675, height: 900 },
    viewer: { src: "/images/bella/v6-s01-monastery-photo-bad7bb44.jpg", width: 1350, height: 1800 },
  },
  {
    id: "S02",
    kind: "video",
    album: "serbia",
    order: 2,
    caption: "Visiting Tumane Monastery",
    alt: "Bella visiting Tumane Monastery",
    roles: ["album", "video"],
    video: {
      src: "/images/bella/v6-s02-monastery-silent-cc8b1816.mp4",
      width: 1920,
      height: 3414,
      duration: 4.871533,
    },
    poster: { src: "/images/bella/v6-s02-monastery-silent-poster-cc8b1816.jpg", width: 1012, height: 1800 },
  }
];

export const bellaAlbums: BellaAlbum[] = [
  {
    id: "younger-days",
    title: "Younger days",
    intro: "A few moments from Bella's puppy days.",
    items: bellaMediaItems.filter((item) => item.album === "younger-days").sort((a, b) => a.order - b.order),
  },
  {
    id: "little-celebrations",
    title: "Little celebrations",
    intro: "Her first birthday and New Year's memories.",
    items: bellaMediaItems.filter((item) => item.album === "little-celebrations").sort((a, b) => a.order - b.order),
  },
  {
    id: "everyday",
    title: "Everyday with Bella",
    intro: "Walks, naps, and time with Seb.",
    items: bellaMediaItems.filter((item) => item.album === "everyday").sort((a, b) => a.order - b.order),
  },
  {
    id: "serbia",
    title: "A moment in Serbia",
    intro:
      "A visit with Bella to Tumane Monastery, tucked into woodland near Golubac in eastern Serbia.",
    items: bellaMediaItems.filter((item) => item.album === "serbia").sort((a, b) => a.order - b.order),
  },
];

export function getBellaAlbum(id: BellaAlbumId): BellaAlbum {
  const album = bellaAlbums.find((entry) => entry.id === id);
  if (!album) throw new Error(`Unknown Bella album: ${id}`);
  return album;
}

export function getBellaPhotos(albumId?: BellaAlbumId): BellaPhotoItem[] {
  const items = albumId ? getBellaAlbum(albumId).items : bellaMediaItems;
  return items.filter((item): item is BellaPhotoItem => item.kind === "photo");
}

export function getBellaItemById(id: string): BellaMediaItem | undefined {
  return bellaMediaItems.find((item) => item.id === id);
}

export function getBellaStoryPortrait(): BellaPhotoItem {
  const item = bellaMediaItems.find(
    (entry): entry is BellaPhotoItem => entry.kind === "photo" && entry.roles.includes("story-portrait"),
  );
  if (!item) throw new Error("Bella story portrait (E05) is missing");
  return item;
}

export function getBellaHomepagePortrait(): BellaPhotoItem {
  const item = bellaMediaItems.find(
    (entry): entry is BellaPhotoItem => entry.kind === "photo" && entry.roles.includes("homepage-portrait"),
  );
  if (!item) throw new Error("Bella homepage portrait is missing");
  return item;
}

export function getBellaHomepageSupports(): BellaPhotoItem[] {
  return bellaMediaItems.filter(
    (entry): entry is BellaPhotoItem => entry.kind === "photo" && entry.roles.includes("homepage-support"),
  );
}

export function albumPhotoCount(album: BellaAlbum): number {
  return album.items.filter((item) => item.kind === "photo").length;
}

export function albumPreviewPhotos(album: BellaAlbum): BellaPhotoItem[] {
  return album.items.filter(
    (item): item is BellaPhotoItem => item.kind === "photo" && item.roles.includes("preview"),
  );
}
