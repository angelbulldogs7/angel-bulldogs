/**
 * Safe FAQ fragment helpers. Hash values are never passed into selectors.
 */

const FAQ_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

/** Decode and validate a location.hash (with or without leading #). */
export function parseFaqFragmentId(hash: string | null | undefined): string | null {
  if (!hash) return null;
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!FAQ_ID_PATTERN.test(decoded)) return null;
  return decoded;
}

/** Match a fragment against known FAQ item ids without using it as a selector. */
export function matchFaqId(fragmentId: string, knownIds: readonly string[]): string | null {
  return knownIds.includes(fragmentId) ? fragmentId : null;
}

/**
 * Resolve a hash to an existing FAQ details element by id equality.
 * Unknown, empty, or malformed fragments return null.
 */
export function resolveFaqDetails(
  hash: string | null | undefined,
  root: ParentNode,
): HTMLDetailsElement | null {
  const fragmentId = parseFaqFragmentId(hash);
  if (!fragmentId) return null;

  const items = root.querySelectorAll<HTMLDetailsElement>("details.faq-item[id]");
  for (const item of items) {
    if (item.id === fragmentId) return item;
  }
  return null;
}
