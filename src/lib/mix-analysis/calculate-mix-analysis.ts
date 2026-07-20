import { calculateMixCompatibility } from "../mix-compatibility";
import { calculateMixProfile } from "../mix-profile";
import { calculateMixRecommendations } from "../mix-recommendation";
import type { MixAnalysisInput, MixAnalysisResult } from "./types";

export const calculateMixAnalysis = (input: MixAnalysisInput): MixAnalysisResult => {
  const mixProfile = calculateMixProfile(input.components);
  const compatibility = calculateMixCompatibility({
    mixProfile,
    componentIntensities: input.components.map(component => ({ flavorId: component.flavorId, intensity: component.profile.intensity })),
  });
  const recommendations = calculateMixRecommendations({ components: input.components, mixProfile, compatibility });
  const confidenceScore = recommendations.recommendations.length
    ? Math.round(recommendations.recommendations.reduce((sum, item) => sum + item.confidenceScore, 0) / recommendations.recommendations.length)
    : 0;
  return {
    mixProfile,
    compatibility,
    recommendations,
    summary: {
      status: recommendations.status,
      confidenceScore,
      hasSignificantAdjustments: recommendations.status === "SIGNIFICANT_ADJUSTMENTS",
      recommendationCount: recommendations.recommendations.length,
      hasSuggestedMixVariant: Boolean(recommendations.summary.suggestedMixVariant),
    },
  };
};
