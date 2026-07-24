import { FLAVOR_PROFILE_FIELDS } from "../flavors/types";
import { MAX_RECOMMENDATIONS, MIX_RECOMMENDATION_VERSION, PERCENTAGE_EPSILON, PRIORITY_ORDER, THRESHOLDS, clamp, round } from "./constants";
import { calculateDominanceRecommendations } from "./dominance-recommendations";
import { allCategories, componentId, makeReason } from "./helpers";
import { calculateProfileRecommendations } from "./profile-recommendations";
import { buildSuggestedMixVariant, finalizeRecommendations } from "./rank-recommendations";
import type { MixRecommendation, MixRecommendationInput, MixRecommendationResult, RecommendationPriority, RecommendationStatus } from "./types";

export class MixRecommendationInputError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.name = "MixRecommendationInputError"; this.code = code; }
}

const validateInput = (input: MixRecommendationInput): void => {
  if (!input || !Array.isArray(input.components)) throw new MixRecommendationInputError("INVALID_INPUT", "Recommendation input is required");
  if (input.components.length < 2 || input.components.length > 5) throw new MixRecommendationInputError("INVALID_COMPONENT_COUNT", "Mix must contain 2 to 5 components");
  const ids = input.components.map(item => componentId(item.flavorId));
  if (new Set(ids).size !== ids.length) throw new MixRecommendationInputError("DUPLICATE_COMPONENT", "Component IDs must be unique");
  if (input.components.some(item => !Number.isFinite(item.percentage) || item.percentage <= 0 || item.percentage >= 100)) throw new MixRecommendationInputError("INVALID_PERCENTAGE", "Each percentage must be between 0 and 100");
  const total = input.components.reduce((sum, item) => sum + item.percentage, 0);
  if (Math.abs(total - 100) > PERCENTAGE_EPSILON) throw new MixRecommendationInputError("INVALID_TOTAL", "Component percentages must total 100");
  // ADR-015/ADR-017: null is a legitimate "not measured" state for any sensory field.
  if (input.components.some(item => FLAVOR_PROFILE_FIELDS.some(key => { const value = item.profile[key]; return value !== null && (!Number.isFinite(value) || value < 0 || value > 10); }))) throw new MixRecommendationInputError("INVALID_PROFILE", "Component profiles must contain values from 0 to 10 or null");
  if (input.components.some(item => item.dataConfidenceScore !== undefined && (!Number.isFinite(item.dataConfidenceScore) || item.dataConfidenceScore < 0 || item.dataConfidenceScore > 100))) throw new MixRecommendationInputError("INVALID_CONFIDENCE", "Data confidence must be between 0 and 100");
  if (input.mixProfile.metadata.calculationVersion !== "mix-profile-v1") throw new MixRecommendationInputError("INVALID_PROFILE_VERSION", "Unsupported mix profile version");
  if (input.compatibility.metadata.calculationVersion !== "mix-compatibility-v1") throw new MixRecommendationInputError("INVALID_COMPATIBILITY_VERSION", "Unsupported compatibility version");
  const resultIds = [input.mixProfile.dominantComponent, ...input.mixProfile.secondaryComponents].map(item => componentId(item.flavorId)).sort();
  if (ids.sort().join("::") !== resultIds.join("::")) throw new MixRecommendationInputError("COMPONENT_MISMATCH", "Components do not match MixProfileResult");
};

const dataConfidence = (input: MixRecommendationInput): number => input.components.reduce((sum, item) => sum + (item.dataConfidenceScore ?? 80), 0) / input.components.length;
const priorityCounts = (recommendations: readonly MixRecommendation[]): Record<RecommendationPriority, number> => ({
  LOW: recommendations.filter(item => item.priority === "LOW").length,
  MEDIUM: recommendations.filter(item => item.priority === "MEDIUM").length,
  HIGH: recommendations.filter(item => item.priority === "HIGH").length,
  CRITICAL: recommendations.filter(item => item.priority === "CRITICAL").length,
});

const preserveRecommendation = (input: MixRecommendationInput): MixRecommendation => ({
  id: "recommendation.preserve-current-mix", type: "PRESERVE_CURRENT_MIX", priority: "LOW", confidenceScore: clamp(round(65 + input.compatibility.compatibilityScore * 3), 0, 100), impactScore: 20,
  componentIds: input.components.map(item => componentId(item.flavorId)).sort(), characteristicKeys: [], noteIds: [], categoryIds: allCategories(input.components),
  action: { type: "PRESERVE_CURRENT_MIX" }, reasons: [makeReason("MIX_ALREADY_BALANCED", input.compatibility.positiveFactors.map(item => item.ruleId), input.components.map(item => componentId(item.flavorId)), [], [], allCategories(input.components), { compatibilityScore: input.compatibility.compatibilityScore })],
  sourceRuleIds: input.compatibility.positiveFactors.map(item => item.ruleId).sort(), knowledgeClaimIds: [],
});

const insufficientRecommendation = (input: MixRecommendationInput): MixRecommendation => ({
  id: "recommendation.insufficient-data", type: "INSUFFICIENT_DATA", priority: "HIGH", confidenceScore: clamp(round(dataConfidence(input)), 0, 100), impactScore: 80,
  componentIds: input.components.map(item => componentId(item.flavorId)).sort(), characteristicKeys: [], noteIds: [], categoryIds: allCategories(input.components),
  action: { type: "INSUFFICIENT_DATA", missingFields: ["reliableProfileEvidence"] }, reasons: [makeReason("PROFILE_DATA_INCOMPLETE", [], input.components.map(item => componentId(item.flavorId)), [], [], allCategories(input.components), { dataConfidence: dataConfidence(input) }), makeReason("KNOWLEDGE_CONFIDENCE_LOW")], sourceRuleIds: [], knowledgeClaimIds: [],
});

const statusFor = (recommendations: readonly MixRecommendation[]): RecommendationStatus => {
  if (recommendations.some(item => item.type === "INSUFFICIENT_DATA")) return "INSUFFICIENT_DATA";
  if (recommendations.length === 1 && recommendations[0].type === "PRESERVE_CURRENT_MIX") return "NO_CHANGES_NEEDED";
  return recommendations.some(item => PRIORITY_ORDER[item.priority] <= PRIORITY_ORDER.HIGH) ? "SIGNIFICANT_ADJUSTMENTS" : "MINOR_ADJUSTMENTS";
};

export const calculateMixRecommendations = (input: MixRecommendationInput): MixRecommendationResult => {
  validateInput(input);
  let recommendations: MixRecommendation[];
  if (dataConfidence(input) < THRESHOLDS.insufficientDataConfidence) recommendations = [insufficientRecommendation(input)];
  else {
    recommendations = finalizeRecommendations([...calculateDominanceRecommendations(input), ...calculateProfileRecommendations(input)]);
    const balanced = input.compatibility.compatibilityScore >= THRESHOLDS.balancedCompatibility && input.compatibility.conflicts.length === 0 && input.compatibility.warnings.length <= 1 && input.compatibility.proportionBalance.score >= THRESHOLDS.balancedBlockScore && input.compatibility.intensityBalance.score >= THRESHOLDS.balancedBlockScore;
    if (!recommendations.length && (balanced || input.compatibility.conflicts.length === 0)) recommendations = [preserveRecommendation(input)];
  }
  recommendations = recommendations.slice(0, MAX_RECOMMENDATIONS);
  const variant = buildSuggestedMixVariant(input.components, recommendations);
  const reasonCodes = [...new Set(recommendations.flatMap(item => item.reasons.map(reason => reason.code)))].sort();
  return {
    version: MIX_RECOMMENDATION_VERSION,
    status: statusFor(recommendations),
    recommendations,
    summary: { recommendationCount: recommendations.length, primaryRecommendationId: recommendations[0]?.id, priorities: priorityCounts(recommendations), reasonCodes, suggestedMixVariant: variant },
  };
};
