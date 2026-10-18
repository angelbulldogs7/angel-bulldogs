import assert from "node:assert/strict";
import { accessSync, constants, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  albumPhotoCount,
  bellaAlbums,
  bellaMediaItems,
  getBellaHomepagePortrait,
  getBellaHomepageSupports,
  getBellaPhotos,
  getBellaStoryPortrait,
} from "../data/bellaMedia";
import { getDam } from "../data/parents";
import { siteConfig } from "../config/site";

const publicRoot = join(process.cwd(), "public");
const storySource = readFileSync(join(process.cwd(), "src/components/BellaStory.astro"), "utf8");
const videoScript = readFileSync(join(process.cwd(), "src/scripts/bella-serbia-video.ts"), "utf8");

function assertPublicAsset(src: string): void {
  const path = join(publicRoot, src.replace(/^\//, ""));
  accessSync(path, constants.R_OK);
}

describe("bellaMedia collection", () => {
  it("accounts for 17 new photos, 6 existing photos, and 1 video", () => {
    const photos = bellaMediaItems.filter((item) => item.kind === "photo");
    const videos = bellaMediaItems.filter((item) => item.kind === "video");
    const existing = photos.filter((item) => item.roles.includes("existing"));
    const fresh = photos.filter((item) => !item.roles.includes("existing"));

    assert.equal(fresh.length, 17);
    assert.equal(existing.length, 6);
    assert.equal(videos.length, 1);
    assert.equal(bellaMediaItems.length, 24);
  });

  it("keeps full album coverage in deliberate order", () => {
    const younger = bellaAlbums.find((album) => album.id === "younger-days");
    const celebrations = bellaAlbums.find((album) => album.id === "little-celebrations");
    const everyday = bellaAlbums.find((album) => album.id === "everyday");
    const serbia = bellaAlbums.find((album) => album.id === "serbia");

    assert.ok(younger && celebrations && everyday && serbia);
    assert.equal(albumPhotoCount(younger), 7);
    assert.equal(albumPhotoCount(celebrations), 4);
    assert.equal(albumPhotoCount(everyday), 11);
    assert.equal(albumPhotoCount(serbia), 1);
    assert.equal(serbia.items.filter((item) => item.kind === "video").length, 1);

    assert.deepEqual(
      getBellaPhotos("younger-days").map((item) => item.id),
      ["Y03", "Y05", "Y07", "Y01", "Y04", "Y02", "Y06"],
    );
    assert.deepEqual(
      getBellaPhotos("little-celebrations").map((item) => item.id),
      ["C01", "N01", "N02", "N03"],
    );
    assert.equal(getBellaPhotos("everyday").length, 11);
  });

  it("uses E05 for story and homepage portraits while keeping the old dam portrait", () => {
    const story = getBellaStoryPortrait();
    const home = getBellaHomepagePortrait();
    const supports = getBellaHomepageSupports();
    const dam = getDam();
    const galleryPortrait = getBellaPhotos("everyday").find((item) => item.id === "X05");

    assert.equal(story.id, "E05");
    assert.equal(home.id, "E05");
    assert.deepEqual(
      supports.map((item) => item.id).sort(),
      ["E03", "Y01"],
    );
    assert.equal(dam.dateOfBirth, "2024-12-23");
    assert.equal(dam.portrait?.src, "/images/bella/v5-portrait.jpg");
    assert.ok(galleryPortrait);
    assert.match(galleryPortrait.viewer.src, /v6-x05-portrait-unmatted/);
    assert.equal(siteConfig.heroPoster, "/images/bella/v5-lifestyle.jpg");
    assert.equal(siteConfig.heroVideo, null);
  });

  it("maps every derivative to a readable public file", () => {
    for (const item of bellaMediaItems) {
      if (item.kind === "photo") {
        assertPublicAsset(item.preview.src);
        assertPublicAsset(item.viewer.src);
        assert.ok(item.viewer.width > 0 && item.viewer.height > 0);
      } else {
        assertPublicAsset(item.video.src);
        assertPublicAsset(item.poster.src);
        assert.ok(item.video.duration > 0);
      }
    }
  });

  it("orders album photos stably by order field", () => {
    for (const album of bellaAlbums) {
      const photos = getBellaPhotos(album.id);
      const orders = photos.map((item) => item.order);
      assert.deepEqual(orders, [...orders].sort((a, b) => a - b));
    }
  });

  it("uses justified rows, Tumane story column, and silent autoplay video wiring", () => {
    assert.match(storySource, /bella-row/);
    assert.match(storySource, /Tumane Monastery/);
    assert.match(storySource, /traditionally traced to the 14th century/);
    assert.match(storySource, /1572/);
    assert.match(storySource, /Saint Zosimus/);
    assert.match(storySource, /data-bella-serbia-video/);
    assert.match(storySource, /data-bella-serbia-motion/);
    assert.doesNotMatch(storySource, /built in 1924/);
    assert.doesNotMatch(storySource, /Silent video|controls|View all|<dialog|data-bella-open/);
    assert.match(videoScript, /prefers-reduced-motion/);
    assert.match(videoScript, /muted/);
    assert.match(videoScript, /IntersectionObserver/);
  });
});
