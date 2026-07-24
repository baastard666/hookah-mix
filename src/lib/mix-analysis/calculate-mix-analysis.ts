import { calculateCanonicalMixScore, groupCompatibilityRisks, prepareCanonicalMix, riskSeverityRank } from "../canonical-mix-scoring";
import { calculateMixCompatibility, resolveComponentIntensity } from "../mix-compatibility";
import { calculateMixProfile } from "../mix-profile";
import { calculateMixRecommendations } from "../mix-recommendation";
import type { MixAnalysisInput, MixAnalysisResult, MixProposalComparison, MixProposalSnapshot } from "./types";

type BaseAnalysis = Omit<MixAnalysisResult, "proposalComparison" | "summary">;
const analyzeBase = (input: MixAnalysisInput): BaseAnalysis => {
  const canonicalMix = prepareCanonicalMix(input.components);
  if (canonicalMix.components.length < 2) throw new Error("После canonical-нормализации микс должен содержать минимум два разных компонента");
  const mixProfile = calculateMixProfile(canonicalMix.components);
  const compatibility = calculateMixCompatibility({ mixProfile, componentIntensities: canonicalMix.components.map(component => ({ flavorId: component.flavorId, intensity: resolveComponentIntensity(component.profile.intensity) })) });
  const recommendations = calculateMixRecommendations({ components: canonicalMix.components, mixProfile, compatibility });
  const scoring = calculateCanonicalMixScore({ preparedMix: canonicalMix, compatibility, verifiedSmokeScore: input.verifiedSmokeScore });
  return { canonicalMix, mixProfile, compatibility, recommendations, scoring };
};

const snapshot = (analysis: BaseAnalysis): MixProposalSnapshot => ({
  predictedQualityScore: analysis.scoring.predictedQualityScore,
  predictionConfidenceScore: analysis.scoring.predictionConfidence.score,
  riskScore: analysis.scoring.scoreBreakdown.risks,
  riskFlags: analysis.scoring.riskFlags,
  dominantInfluenceShare: analysis.mixProfile.dominantComponent.influenceShare,
  dominanceLevel: analysis.mixProfile.dominanceLevel,
});

const compareProposal = (current: BaseAnalysis, proposed: BaseAnalysis, variant: NonNullable<BaseAnalysis["recommendations"]["summary"]["suggestedMixVariant"]>): MixProposalComparison => {
  const changed = variant.components.find(item => item.currentPercentage !== item.suggestedPercentage);
  const currentGroups = groupCompatibilityRisks(current.compatibility);
  const proposedGroups = groupCompatibilityRisks(proposed.compatibility);
  const currentTarget = changed ? currentGroups.find(group => group.componentId === changed.componentId) : undefined;
  const proposedTarget = currentTarget ? proposedGroups.find(group => group.causeKey === currentTarget.causeKey) : undefined;
  const severityReduced = Boolean(currentTarget && (!proposedTarget || riskSeverityRank(proposedTarget.severity) < riskSeverityRank(currentTarget.severity)));
  const influenceReduced = proposed.mixProfile.dominantComponent.influenceShare <= current.mixProfile.dominantComponent.influenceShare - 4.9;
  const targetRiskReduced = severityReduced || influenceReduced;
  const currentHigh = new Set(currentGroups.filter(group => group.severity === "HIGH").map(group => group.causeKey));
  const newHighRisk = proposedGroups.some(group => group.severity === "HIGH" && !currentHigh.has(group.causeKey));
  const rejectionReasons: string[] = [];
  if (!targetRiskReduced) rejectionReasons.push("TARGET_RISK_NOT_REDUCED");
  if (newHighRisk) rejectionReasons.push("NEW_HIGH_RISK");
  if (proposed.scoring.predictedQualityScore < current.scoring.predictedQualityScore - 0.2) rejectionReasons.push("SCORE_WORSE");
  if (proposed.compatibility.profileBalance.score < current.compatibility.profileBalance.score - 0.2) rejectionReasons.push("PROFILE_BALANCE_WORSE");
  if (Math.abs(variant.components.reduce((sum, item) => sum + item.suggestedPercentage, 0) - 100) > 0.0001) rejectionReasons.push("INVALID_TOTAL");
  return { accepted: rejectionReasons.length === 0, variant, current: snapshot(current), proposed: snapshot(proposed), targetRiskReduced, rejectionReasons };
};

export const calculateMixAnalysis = (input: MixAnalysisInput): MixAnalysisResult => {
  const current = analyzeBase(input);
  const { canonicalMix, mixProfile, compatibility, recommendations, scoring } = current;
  const variant = recommendations.summary.suggestedMixVariant;
  let proposalComparison: MixProposalComparison | undefined;
  if (variant) {
    const percentages = new Map(variant.components.map(item => [item.componentId, item.suggestedPercentage]));
    const proposedInput = input.components.map(component => ({ ...component, percentage: percentages.get(String(component.flavorId)) ?? component.percentage }));
    const proposed = analyzeBase({ ...input, components: proposedInput });
    proposalComparison = compareProposal(current, proposed, variant);
  }
  const confidenceScore = recommendations.recommendations.length
    ? Math.round(recommendations.recommendations.reduce((sum, item) => sum + item.confidenceScore, 0) / recommendations.recommendations.length)
    : 0;
  return {
    canonicalMix,
    mixProfile,
    compatibility,
    recommendations,
    scoring,
    proposalComparison,
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
