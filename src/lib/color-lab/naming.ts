import { NAME_TOKEN_ORDER } from "../../data/color-lab/phenotypeNames";
import type { NameTokens } from "./types";

function tokenText(tokens: NameTokens, token: keyof NameTokens): string | null {
  switch (token) {
    case "hairless":
      return tokens.hairless ? "Hairless" : null;
    case "color":
      return tokens.color;
    case "pattern":
      return tokens.pattern;
    case "brindle":
      return tokens.brindle ? "Brindle" : null;
    case "merle":
      return tokens.merle;
    case "pied":
      return tokens.pied ? "Pied" : null;
    case "solid":
      return tokens.solid ? "Solid" : null;
    case "fluffy":
      return tokens.fluffy ? "Fluffy" : null;
    case "bigRope":
      return tokens.bigRope ? "Big Rope" : null;
  }
}

/** Names come only from structured tokens, so control order can never change a name. */
export function composeName(tokens: NameTokens): string {
  const parts: string[] = [];
  for (const token of NAME_TOKEN_ORDER) {
    const text = tokenText(tokens, token);
    if (text) parts.push(text);
  }
  return parts.join(" ");
}
