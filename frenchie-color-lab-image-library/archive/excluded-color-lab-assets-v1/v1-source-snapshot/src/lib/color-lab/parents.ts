import type { DogSex } from "./types";

export type ParentRole = "stud" | "dam";

export function expectedSexForRole(role: ParentRole): DogSex {
  return role === "stud" ? "male" : "female";
}

/** Loading a saved dog into the opposite role must be confirmed, never silently relabeled. */
export function loadRequiresSexConfirm(savedSex: DogSex, role: ParentRole): boolean {
  return savedSex !== expectedSexForRole(role);
}
