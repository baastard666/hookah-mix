import type { RecommendationPriority } from "./types";

export const MIX_RECOMMENDATION_VERSION = "mix-recommendation-v1" as const;
export const MAX_RECOMMENDATIONS = 5;
export const PERCENTAGE_EPSILON = 0.0001;
export const PRIORITY_ORDER: Readonly<Record<RecommendationPriority, number>> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
export const THRESHOLDS = {
  insufficientDataConfidence: 30,
  balancedCompatibility: 8,
  balancedBlockScore: 7.5,
  intense: 8,
  veryIntense: 9,
  largeAccentPercentage: 30,
  safeAccentPercentage: 15,
  tracePercentage: 5,
  weakPercentage: 10,
  equalPercentageTolerance: 5,
} as const;

export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
export const round = (value: number, digits = 0): number => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};
