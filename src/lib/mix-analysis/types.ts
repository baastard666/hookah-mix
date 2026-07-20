import type { MixCompatibilityResult } from "../mix-compatibility";
import type { MixProfileResult } from "../mix-profile";
import type { MixRecommendationResult, RecommendationComponentInput, RecommendationStatus } from "../mix-recommendation";

export type MixAnalysisInput = { readonly components: readonly RecommendationComponentInput[] };
export type MixAnalysisSummary = {
  readonly status: RecommendationStatus;
  readonly confidenceScore: number;
  readonly hasSignificantAdjustments: boolean;
  readonly recommendationCount: number;
  readonly hasSuggestedMixVariant: boolean;
};
export type MixAnalysisResult = {
  readonly mixProfile: MixProfileResult;
  readonly compatibility: MixCompatibilityResult;
  readonly recommendations: MixRecommendationResult;
  readonly summary: MixAnalysisSummary;
};
