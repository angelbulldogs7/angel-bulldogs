import type { Confirmation, DogSex } from "./types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSex(value: unknown): DogSex | null {
  return value === "male" || value === "female" ? value : null;
}

export function parseConfirmation(value: unknown): Confirmation | null {
  return value === "assumed" || value === "lab-confirmed" ? value : null;
}

/** Visitor-provided names are stored as plain text only and never rendered as HTML. */
export function sanitizeDogName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 80);
}

export function boundedString(value: unknown, max: number): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= max ? value : null;
}
