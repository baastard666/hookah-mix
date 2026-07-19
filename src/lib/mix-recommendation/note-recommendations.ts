import type { FlavorNoteCategory } from "../flavor-knowledge";
import { allCategories, claimsForRelation, compatibleDirection, confidenceFor, makeReason } from "./helpers";
import type { MixRecommendation, MixRecommendationInput, RecommendationReasonCode } from "./types";

export const createNoteDirectionRecommendation = (
  input: MixRecommendationInput,
  candidates: readonly FlavorNoteCategory[],
  reasonCode: RecommendationReasonCode,
  sourceRuleIds: readonly string[],
  characteristicKeys: MixRecommendation["characteristicKeys"],
  impactScore = 42,
): MixRecommendation | undefined => {
  const current = allCategories(input.components);
  const selected = compatibleDirection(candidates, current);
  if (!selected) return undefined;
  const claimIds = claimsForRelation(selected, current);
  const dataConfidence = input.components.reduce((sum, item) => sum + (item.dataConfidenceScore ?? 80), 0) / input.components.length;
  return {
    id: `recommendation.add-direction.${selected.toLowerCase()}.${reasonCode.toLowerCase()}`, type: "ADD_NOTE_DIRECTION", priority: impactScore >= 55 ? "HIGH" : "MEDIUM",
    confidenceScore: confidenceFor(dataConfidence, sourceRuleIds, claimIds, true), impactScore,
    componentIds: [], characteristicKeys, noteIds: [], categoryIds: [selected],
    action: { type: "ADD_NOTE_DIRECTION", categoryIds: [selected], recommendedRole: "ACCENT", suggestedPercentageRange: { min: 5, max: 12 } },
    reasons: [makeReason(reasonCode, sourceRuleIds, [], characteristicKeys, [], [selected], { checkedAgainstCategories: current })], sourceRuleIds: [...sourceRuleIds], knowledgeClaimIds: claimIds,
  };
};
