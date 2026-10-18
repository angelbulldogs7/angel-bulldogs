import type { Puppy, PuppySex, PuppyStatus } from "../data/types";
import { PUPPY_STATUS_LABELS } from "../data/types";
import { getLitterBirthDate } from "../data/litter";
import { formatBirthDateLong } from "./puppyAge";

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Date to be confirmed";
  return formatBirthDateLong(iso);
}

export function formatSex(sex: PuppySex): string {
  return sex === "female" ? "Female" : "Male";
}

export function formatPuppyStatus(status: PuppyStatus): string {
  return PUPPY_STATUS_LABELS[status];
}

export function getPuppyBirthDate(puppy: Pick<Puppy, "dateOfBirth">): string {
  return puppy.dateOfBirth ?? getLitterBirthDate();
}

export function formatEstimatedCarriers(traits: readonly string[]): string | null {
  if (!traits.length) return null;
  return `Estimated carrier traits: ${traits.join(", ")}`;
}

/**
 * Active nav matching. Home only matches exactly.
 * Available Puppies stays active on /puppies and /puppies/<slug>.
 */
export function isCurrentPath(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  const target = href.replace(/\/$/, "") || "/";
  if (target === "/") return path === "/";
  if (target === "/puppies") return path === "/puppies" || path.startsWith("/puppies/");
  return path === target;
}

export function copyrightYear(): number {
  return new Date().getFullYear();
}
