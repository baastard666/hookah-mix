import type { EffectiveProfileSource } from "./types";

export const CANONICAL_MIX_SCORING_VERSION = "canonical-mix-scoring-v1" as const;
export const MIX_SCORE_WEIGHTS = Object.freeze({ compatibility: 0.25, proportions: 0.2, componentQuality: 0.2, balance: 0.15, risks: 0.1, confirmations: 0.1 });
export const PROFILE_SOURCE_PRIORITY: Readonly<Record<EffectiveProfileSource, number>> = Object.freeze({
  USER_SMOKE: 7,
  INTERNAL_TEST: 6,
  CANONICAL_PRODUCT_PROFILE: 5,
  EXTERNAL_AGGREGATE: 4,
  CANONICAL_TECHNICAL_PROFILE: 3,
  PRELIMINARY_PROFILE: 3,
  SOURCE_PROFILE: 1,
  NEUTRAL_FALLBACK: 0,
});
export const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));
export const round = (value: number, digits = 1): number => { const factor = 10 ** digits; return Math.round((value + Number.EPSILON) * factor) / factor; };
