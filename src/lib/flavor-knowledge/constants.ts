import type { FlavorNoteCategory, KnowledgeEvidenceType } from "./types";

export const FLAVOR_NOTE_CATEGORIES = [
  "BERRY", "FRUIT", "CITRUS", "TROPICAL", "FLORAL", "HERBAL", "MINT", "COOLING",
  "SPICE", "DESSERT", "CREAMY", "VANILLA", "BEVERAGE", "TEA", "COFFEE", "NUT",
  "BAKERY", "CANDY", "CHOCOLATE", "ALCOHOL", "WOODY", "SMOKY", "TOBACCO", "SOUR", "FRESH",
] as const satisfies readonly FlavorNoteCategory[];

export const RELATION_TYPES = ["STRONG_MATCH", "GOOD_MATCH", "COMPLEMENTARY_CONTRAST", "NEUTRAL", "RISKY", "CONFLICT"] as const;
export const EVIDENCE_TYPES = ["MANUFACTURER_DESCRIPTION", "EDITORIAL_RESEARCH", "COMMUNITY_AGGREGATE", "VERIFIED_TEST", "INTERNAL_EXPERT_RULE", "INFERRED_RELATION", "AGGREGATED_RESEARCH", "VERIFIED_MIX_HISTORY"] as const satisfies readonly KnowledgeEvidenceType[];
export const CLAIM_SUBJECT_TYPES = ["NOTE", "CATEGORY", "CATEGORY_RELATION", "NOTE_RELATION"] as const;

export const CONFIDENCE_WEIGHTS = {
  averageEvidenceWeight: 55,
  additionalEvidence: 5,
  maxAdditionalEvidenceBonus: 15,
  additionalSourceType: 8,
  maxSourceDiversityBonus: 16,
  verifiedTestBonus: 20,
  inferredOnlyCap: 25,
  singleExpertCap: 50,
  manufacturerOnlyCap: 45,
  communityOnlyCap: 45,
  lowMaximum: 39,
  mediumMaximum: 69,
} as const;

export const KNOWLEDGE_VERSION = "flavor-knowledge-v1" as const;
export const DEFAULT_NEUTRAL_RELATION_SCORE = 0;

export const normalizePairKey = (left: string, right: string): string =>
  [left, right].sort((a, b) => a.localeCompare(b, "en")).join("::");

export const round = (value: number, digits = 0): number => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};
