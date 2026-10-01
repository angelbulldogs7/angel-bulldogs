import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildVisualManifest,
  manifestSummaryMarkdown,
  serializeManifest,
} from "../src/lib/color-lab/manifest.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "frenchie-color-lab-image-library/manifest");
mkdirSync(outDir, { recursive: true });

const manifest = buildVisualManifest();
writeFileSync(resolve(outDir, "visual-manifest.v2.json"), serializeManifest(manifest));
writeFileSync(resolve(outDir, "SUMMARY.md"), manifestSummaryMarkdown(manifest));

console.log(
  `Color Lab manifest: ${manifest.counts.visualRecipes} visual recipes, ${manifest.counts.layers} layers ` +
    `(${manifest.counts.approvedLayers} approved).`,
);
