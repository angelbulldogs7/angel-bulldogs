import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getLocus } from "../src/data/color-lab/loci.ts";
import { buildVisualManifest } from "../src/lib/color-lab/manifest.ts";
import { locusContribution, resolveProfile } from "../src/lib/color-lab/phenotypeResolver.ts";
import { COLOR_LAB_SCHEMA_VERSION, COLOR_LAB_RULESET_VERSION, LOCUS_IDS } from "../src/lib/color-lab/types.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pipelineRoot = resolve(root, "tools/puppy-image-pipeline");
const manifestsDir = resolve(pipelineRoot, "manifests");

const HISTORICAL_TARGET = 3454;
const MASTER_REFERENCE_ID = "master/classic-fawn-solid-master-v2";

function parseSignature(signature) {
  const parsed = {};
  for (const part of signature.split(";")) {
    const [key, value] = part.split("=");
    parsed[key] = value;
  }
  return parsed;
}

function toCoatType(base) {
  if (base === "standard") return "short";
  if (base === "fluffy") return "fluffy";
  return "hairless";
}

function toBoolean(value) {
  return value === "1";
}

function visiblePhaeomelaninRegions(coat) {
  switch (coat) {
    case "solid":
      return [];
    case "fawn":
    case "sable":
      return ["body-ground"];
    case "and-tan":
    case "husky":
      return ["pattern-panels-and-points"];
    case "cream-white":
      return ["body-ground-and-masked-overlays"];
    case "cream":
    case "platinum":
    case "pink":
      return ["full-body"];
    default:
      return [];
  }
}

function visiblePatternPlacement(parts) {
  const overlays = [];
  if (toBoolean(parts.brindle)) overlays.push("brindle-stripes-over-phaeomelanin");
  if (toBoolean(parts.mask)) overlays.push("facial-mask");
  if (toBoolean(parts.merle)) {
    overlays.push(toBoolean(parts.brindle) ? "merle-on-eumelanin-and-brindle-stripes" : "merle-on-eumelanin-zones");
  }
  if (toBoolean(parts.pied)) overlays.push("representative-pied-map");
  return overlays;
}

function hiddenTraitNotes(parts) {
  const notes = [
    "carrier-state-hidden",
    "sex-hidden",
    "lab-confirmation-hidden",
    "dog-name-hidden",
  ];
  if (parts.base === "hairless") notes.push("fur-length-overridden-by-hairless");
  if (parts.coat === "cream" || parts.coat === "platinum" || parts.coat === "pink") {
    notes.push("pigment-family-not-directly-visible");
  }
  return notes;
}

function outputRelativePath(parts, filename) {
  const coatType = toCoatType(parts.base);
  const pigment = parts.pigment === "none" ? "none" : parts.pigment;
  return `outputs/approved/${coatType}/${pigment}/${filename}.webp`;
}

function countMap(values) {
  const map = {};
  for (const value of values) map[value] = (map[value] ?? 0) + 1;
  return map;
}

function groupedContributions(includeConceptionOnlyFoxi3) {
  return LOCUS_IDS.map((locus) => {
    const seen = new Map();
    for (const option of getLocus(locus).options) {
      if (!option.selectable && !(includeConceptionOnlyFoxi3 && locus === "foxi3")) continue;
      const contribution = locusContribution(locus, option.id);
      const key = JSON.stringify(contribution);
      if (!seen.has(key)) seen.set(key, contribution);
    }
    return [...seen.values()];
  });
}

function countOutcomes(grouped) {
  let viable = 0;
  let concerning = 0;
  let nonviable = 0;

  const walk = (depth, profile) => {
    if (depth === grouped.length) {
      const result = resolveProfile(profile, { bigRope: false });
      if (result.kind === "viable") viable += 1;
      if (result.kind === "concerning") concerning += 1;
      if (result.kind === "nonviable") nonviable += 1;
      return;
    }
    for (const contribution of grouped[depth]) {
      walk(depth + 1, { ...profile, ...contribution });
    }
  };

  walk(0, {});
  return { viable, concerning, nonviable };
}

function summarizeExclusions() {
  const selectable = countOutcomes(groupedContributions(false));
  const withConceptionOnlyFoxi3 = countOutcomes(groupedContributions(true));
  return {
    viable: selectable.viable,
    concerning: selectable.concerning,
    nonviable_selectable: selectable.nonviable,
    nonviable_including_conception_only_foxi3: withConceptionOnlyFoxi3.nonviable,
  };
}

function slugWithCollisionGuard(rows) {
  const byPath = new Map();
  return rows.map((row) => {
    const count = (byPath.get(row.output_relative_path) ?? 0) + 1;
    byPath.set(row.output_relative_path, count);
    if (count === 1) return row;
    const suffix = row.visual_id.replace(/^clv2-/, "");
    const filename = `${row.filename}--${suffix}`;
    return { ...row, filename, output_relative_path: outputRelativePath(row.signature_parts, filename) };
  });
}

function buildRows() {
  const manifest = buildVisualManifest();
  const baseRows = manifest.recipes.map((recipe) => {
    const signatureParts = parseSignature(recipe.visibleSignature);
    const filename = recipe.slug;
    const publicName = recipe.publicNames[0] ?? recipe.slug;
    const aliases = recipe.publicNames.slice(1);
    return {
      visual_id: recipe.visualId,
      visible_signature: recipe.visibleSignature,
      public_name: publicName,
      aliases,
      coat_type: toCoatType(signatureParts.base),
      pigment_family: signatureParts.pigment,
      resolved_visible_traits: {
        base: signatureParts.base,
        coat: signatureParts.coat,
        pigment_family: signatureParts.pigment,
        phaeomelanin_regions: visiblePhaeomelaninRegions(signatureParts.coat),
        visible_pattern_placement: visiblePatternPlacement(signatureParts),
        representative_eyes: signatureParts.eyes,
        explicit_suppressed_traits: hiddenTraitNotes(signatureParts),
      },
      representative_eyes: signatureParts.eyes,
      big_rope: toBoolean(signatureParts.bigRope),
      source_reference_ids: [MASTER_REFERENCE_ID, ...recipe.layers.map((layer) => `layer/${layer}`)],
      output_relative_path: outputRelativePath(signatureParts, filename),
      filename,
      alt_text: recipe.alt,
      ruleset_version: COLOR_LAB_RULESET_VERSION,
      schema_version: COLOR_LAB_SCHEMA_VERSION,
      notice_flags: [...recipe.notices],
      signature_parts: signatureParts,
    };
  });

  const withCollisionGuard = slugWithCollisionGuard(baseRows);
  return withCollisionGuard
    .sort((a, b) => (a.output_relative_path < b.output_relative_path ? -1 : a.output_relative_path > b.output_relative_path ? 1 : 0))
    .map((row) => {
      const { filename: _filename, signature_parts: _parts, ...clean } = row;
      return clean;
    });
}

function writeOutputs(rows) {
  mkdirSync(manifestsDir, { recursive: true });
  const jsonl = rows.map((row) => JSON.stringify(row)).join("\n") + "\n";
  writeFileSync(resolve(manifestsDir, "phenotypes.jsonl"), jsonl);

  const exclusions = summarizeExclusions();
  const byCoatType = countMap(rows.map((row) => row.coat_type));
  const byPigment = countMap(rows.map((row) => row.pigment_family));
  const byBigRope = countMap(rows.map((row) => (row.big_rope ? "on" : "off")));

  const rowsWithAliases = rows.filter((row) => row.aliases.length > 0);
  const aliasCount = rowsWithAliases.reduce((total, row) => total + row.aliases.length, 0);
  const summary = {
    generated_at: new Date().toISOString(),
    ruleset_version: COLOR_LAB_RULESET_VERSION,
    schema_version: COLOR_LAB_SCHEMA_VERSION,
    total_visual_signatures: rows.length,
    historical_target: HISTORICAL_TARGET,
    target_delta: rows.length - HISTORICAL_TARGET,
    counts_by_coat_type: byCoatType,
    counts_by_pigment_family: byPigment,
    counts_by_big_rope: byBigRope,
    exclusions,
    deduplicated_aliases: {
      signatures_with_aliases: rowsWithAliases.length,
      alias_labels: aliasCount,
      sample: rowsWithAliases.slice(0, 5).map((row) => ({
        visual_id: row.visual_id,
        public_name: row.public_name,
        aliases: row.aliases,
      })),
    },
  };
  writeFileSync(resolve(manifestsDir, "phenotype-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

const rows = buildRows();
writeOutputs(rows);
console.log(`Exported ${rows.length} phenotype rows to tools/puppy-image-pipeline/manifests/phenotypes.jsonl`);
