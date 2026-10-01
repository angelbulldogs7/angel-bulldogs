import type { PuppySex } from "../data/types";

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Birth date on inquiry";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatSex(sex: PuppySex): string {
  return sex === "female" ? "Female" : "Male";
}

export function isCurrentPath(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (href === "/") return path === "/";
  return path === href;
}

export function copyrightYear(): number {
  return new Date().getFullYear();
}
