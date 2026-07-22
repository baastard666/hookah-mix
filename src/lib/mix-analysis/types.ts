import type { CanonicalMixComponentInput, CanonicalMixScoringResult, PreparedCanonicalMix } from "../canonical-mix-scoring";
import type { MixCompatibilityResult } from "../mix-compatibility";
import type { MixProfileResult } from "../mix-profile";
import type { MixRecommendationResult, RecommendationStatus } from "../mix-recommendation";

export type MixAnalysisInput = { readonly components: readonly CanonicalMixComponentInput[]; readonly verifiedSmokeScore?: number | null };
export type MixAnalysisSummary = {
  readonly status: RecommendationStatus;
  readonly confidenceScore: number;
  readonly hasSignificantAdjustments: boolean;
  readonly recommendationCount: number;
  readonly hasSuggestedMixVariant: boolean;
  readonly predictedQualityScore: number;
  readonly predictionConfidenceScore: number;
  readonly confidenceLabel: CanonicalMixScoringResult["predictionConfidence"]["finalConfidenceLabel"];
  readonly dataQuality: number;
};
export type MixAnalysisResult = {
  readonly canonicalMix: PreparedCanonicalMix;
  readonly mixProfile: MixProfileResult;
  readonly compatibility: MixCompatibilityResult;
  readonly recommendations: MixRecommendationResult;
  readonly scoring: CanonicalMixScoringResult;
  readonly summary: MixAnalysisSummary;
};
