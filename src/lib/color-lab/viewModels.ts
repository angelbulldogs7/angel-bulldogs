import { carrierSentences, dnaRowsForGenotype, dnaRowsForGroup, maskedTraitSentences, type DnaRow } from "./hiddenDna";
import type { PhenotypeGroup } from "./inheritance";
import { resolveDog, resolveProfile } from "./phenotypeResolver";
import { formatFraction } from "./probabilityFormatting";
import { NOTICES, interestEligibility, type NoticeSeverity } from "./safetyRules";
import type { Confirmation, DogState, InterestEligibility, NoticeCode, VisiblePhenotype } from "./types";

export interface NoticeView {
  readonly code: NoticeCode;
  readonly severity: NoticeSeverity;
  readonly title: string;
  readonly text: string;
}

const SEVERITY_ORDER: Readonly<Record<NoticeSeverity, number>> = { critical: 0, warning: 1, info: 2 };

export function noticeViews(codes: readonly NoticeCode[]): NoticeView[] {
  return [...new Set(codes)]
    .map((code) => ({ code, ...NOTICES[code] }))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export interface DogPreviewModel {
  readonly result: VisiblePhenotype;
  readonly confirmation: Confirmation;
  readonly notices: readonly NoticeView[];
  readonly carriers: readonly string[];
  readonly hidden: readonly string[];
  readonly dnaRows: readonly DnaRow[];
  readonly eligibility: InterestEligibility;
}

/** Build a Frenchie preview. Dup/Dup is not selectable, so a living dog always resolves. */
export function dogPreviewModel(state: DogState): DogPreviewModel {
  const result = resolveDog(state);
  if (result.kind === "nonviable") throw new Error("A selectable dog cannot be nonviable.");
  return {
    result,
    confirmation: state.confirmation,
    notices: noticeViews(result.notices),
    carriers: carrierSentences(state.genotype),
    hidden: maskedTraitSentences(result.masked),
    dnaRows: dnaRowsForGenotype(state.genotype),
    eligibility: interestEligibility(result),
  };
}

export interface PhenotypeCardModel {
  readonly key: string;
  readonly kind: VisiblePhenotype["kind"];
  readonly result: VisiblePhenotype;
  readonly percent: string;
  readonly exact: string;
  readonly viablePercent: string | null;
  readonly notices: readonly NoticeView[];
  /** Possible genotypes per locus, without carrier percentages (those live in Genotypes). */
  readonly dnaRows: readonly DnaRow[];
  readonly hidden: readonly string[];
  readonly eligibility: InterestEligibility;
  readonly canPreviewBigRope: boolean;
  readonly bigRopePreview: boolean;
}

export function phenotypeCardModel(group: PhenotypeGroup, bigRopePreview = false): PhenotypeCardModel {
  const canPreviewBigRope = group.result.kind === "viable";
  let result: VisiblePhenotype = group.result;
  if (bigRopePreview && canPreviewBigRope) {
    const previewed = resolveProfile(group.result.profile, { bigRope: true });
    if (previewed.kind === "nonviable") throw new Error("A viable group cannot become nonviable.");
    result = previewed;
  }
  return {
    key: group.key,
    kind: result.kind,
    result,
    percent: group.percent,
    exact: formatFraction(group.exact),
    viablePercent: group.viablePercent,
    notices: noticeViews(result.notices),
    dnaRows: dnaRowsForGroup(group.possibleGenotypes),
    hidden: maskedTraitSentences(group.masked),
    eligibility: group.eligibility,
    canPreviewBigRope,
    bigRopePreview: bigRopePreview && canPreviewBigRope,
  };
}
