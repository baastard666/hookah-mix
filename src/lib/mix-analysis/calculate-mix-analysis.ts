import { calculateCanonicalMixScore, prepareCanonicalMix } from "../canonical-mix-scoring";
import { calculateMixCompatibility } from "../mix-compatibility";
import { calculateMixProfile } from "../mix-profile";
import { calculateMixRecommendations } from "../mix-recommendation";
import type { MixAnalysisInput, MixAnalysisResult } from "./types";

export const calculateMixAnalysis = (input: MixAnalysisInput): MixAnalysisResult => {
  const canonicalMix = prepareCanonicalMix(input.components);
  if (canonicalMix.components.length < 2) throw new Error("После canonical-нормализации микс должен содержать минимум два разных компонента");
  const mixProfile = calculateMixProfile(canonicalMix.components);
  const compatibility = calculateMixCompatibility({
    mixProfile,
    componentIntensities: canonicalMix.components.map(component => ({ flavorId: component.flavorId, intensity: component.profile.intensity })),
  });
  const recommendations = calculateMixRecommendations({ components: canonicalMix.components, mixProfile, compatibility });
  const scoring = calculateCanonicalMixScore({ preparedMix: canonicalMix, compatibility, verifiedSmokeScore: input.verifiedSmokeScore });
  const confidenceScore = recommendations.recommendations.length
    ? Math.round(recommendations.recommendations.reduce((sum, item) => sum + item.confidenceScore, 0) / recommendations.recommendations.length)
    : 0;
  return {
    canonicalMix,
    mixProfile,
    compatibility,
    recommendations,
    scoring,
    summary: {
      status: recommendations.status,
      confidenceScore,
      hasSignificantAdjustments: recommendations.status === "SIGNIFICANT_ADJUSTMENTS",
      recommendationCount: recommendations.recommendations.length,
      hasSuggestedMixVariant: Boolean(recommendations.summary.suggestedMixVariant),
      predictedQualityScore: scoring.predictedQualityScore,
      predictionConfidenceScore: scoring.predictionConfidence.score,
      confidenceLabel: scoring.predictionConfidence.finalConfidenceLabel,
      dataQuality: scoring.dataQuality,
    },
  };
};
