import { allCategories, componentCategories, componentId, confidenceFor, decreaseRange, hasRule, makeReason, rules, sourceComponentForCharacteristic } from "./helpers";
import { createNoteDirectionRecommendation } from "./note-recommendations";
import type { MixRecommendation, MixRecommendationInput, RecommendationReasonCode } from "./types";

const decreaseSource = (input: MixRecommendationInput, key: "sweetness" | "cooling" | "bitterness" | "acidity" | "dryness", reasonCode: RecommendationReasonCode, sourceRules: readonly string[], impact: number): MixRecommendation => {
  const source = sourceComponentForCharacteristic(input.components, key);
  const id = componentId(source.flavorId);
  const categories = componentCategories(source);
  const dataConfidence = input.components.reduce((sum, item) => sum + (item.dataConfidenceScore ?? 80), 0) / input.components.length;
  return {
    id: `recommendation.decrease.${id}.${reasonCode.toLowerCase()}`, type: "DECREASE_COMPONENT", priority: impact >= 75 ? "CRITICAL" : impact >= 55 ? "HIGH" : "MEDIUM",
    confidenceScore: confidenceFor(dataConfidence, sourceRules, [], true), impactScore: impact,
    componentIds: [id], characteristicKeys: [key], noteIds: source.notes.map(note => note.noteSlug).sort(), categoryIds: categories,
    action: { type: "DECREASE_COMPONENT", componentId: id, currentPercentage: source.percentage, suggestedPercentageRange: decreaseRange(source), suggestedRole: source.percentage >= 45 ? "SUPPORT" : "ACCENT" },
    // ADR-015: `key` may be a secondary field that is null ("not measured") for the chosen source component - report that honestly instead of coercing it to 0.
    reasons: [makeReason(reasonCode, sourceRules, [id], [key], source.notes.map(note => note.noteSlug), categories, { weightedContribution: source.profile[key] === null ? null : source.profile[key] * source.percentage / 100 })], sourceRuleIds: [...sourceRules], knowledgeClaimIds: [],
  };
};

export const calculateProfileRecommendations = (input: MixRecommendationInput): MixRecommendation[] => {
  const result: MixRecommendation[] = [];
  const warningRuleIds = rules(input.compatibility.warnings);
  const conflictRuleIds = rules(input.compatibility.conflicts);

  const sweetRules = warningRuleIds.filter(id => ["profile.cloying", "profile.dense-dessert", "profile.sweet-low-freshness"].includes(id));
  if (sweetRules.length) {
    result.push(decreaseSource(input, "sweetness", "EXCESSIVE_SWEETNESS", sweetRules, 58));
    const direction = createNoteDirectionRecommendation(input, ["SOUR", "CITRUS", "FRESH", "SPICE"], "ADD_COMPLEMENTARY_CONTRAST", sweetRules, ["sweetness"], 45);
    if (direction) result.push(direction);
  }

  const coolingRules = warningRuleIds.filter(id => id === "profile.strong-cooling" || id === "profile.extreme-cooling" || id === "note.coffee-cooling" || id === "note.dairy-cooling");
  if (coolingRules.length) result.push(decreaseSource(input, "cooling", "EXCESSIVE_COOLING", coolingRules, 68));

  const bitterSourRules = conflictRuleIds.filter(id => id === "profile.bitterness-acidity");
  if (bitterSourRules.length) {
    const bitterness = sourceComponentForCharacteristic(input.components, "bitterness");
    const acidity = sourceComponentForCharacteristic(input.components, "acidity");
    // ADR-015: bitterness is a secondary field and may be null ("not measured") for the chosen component;
    // acidity is core and always known. When bitterness is unmeasured we cannot claim it dominates, so the
    // comparison conservatively favors the known quantity (acidity) rather than guessing a bitterness value.
    const key = (bitterness.profile.bitterness ?? 0) * bitterness.percentage >= acidity.profile.acidity * acidity.percentage ? "bitterness" : "acidity";
    result.push(decreaseSource(input, key, "BITTER_SOUR_CONFLICT", bitterSourRules, 85));
    const direction = createNoteDirectionRecommendation(input, ["VANILLA", "CREAMY"], "ADD_SOFTENING_DIRECTION", bitterSourRules, ["bitterness", "acidity"], 55);
    if (direction) result.push(direction);
  }

  const dryRules = warningRuleIds.filter(id => id === "profile.dry-bitterness" || id === "profile.dryness-bitterness");
  if (dryRules.length) {
    result.push(decreaseSource(input, "dryness", "EXCESSIVE_DRYNESS", dryRules, 52));
    const direction = createNoteDirectionRecommendation(input, ["CREAMY", "FRUIT", "FRESH"], "ADD_SOFTENING_DIRECTION", dryRules, ["dryness"], 42);
    if (direction) result.push(direction);
  }

  const riskyPairRules = warningRuleIds.filter(id => id === "category.coffee-citrus");
  if (riskyPairRules.length) {
    const citrus = input.components.filter(item => componentCategories(item).includes("CITRUS")).sort((a, b) => b.percentage - a.percentage || componentId(a.flavorId).localeCompare(componentId(b.flavorId), "en"))[0];
    if (citrus) {
      const id = componentId(citrus.flavorId);
      const categories = componentCategories(citrus);
      const claimIds = ["claim.relation.coffee-citrus"];
      const confidence = input.components.reduce((sum, item) => sum + (item.dataConfidenceScore ?? 80), 0) / input.components.length;
      result.push({
        id: `recommendation.decrease.${id}.risky-category-pair`, type: "DECREASE_COMPONENT", priority: "HIGH", confidenceScore: confidenceFor(confidence, riskyPairRules, claimIds, true), impactScore: 60,
        componentIds: [id], characteristicKeys: ["acidity"], noteIds: citrus.notes.map(note => note.noteSlug).sort(), categoryIds: categories,
        action: { type: "DECREASE_COMPONENT", componentId: id, currentPercentage: citrus.percentage, suggestedPercentageRange: decreaseRange(citrus), suggestedRole: "SUPPORT" },
        reasons: [makeReason("RISKY_CATEGORY_PAIR", riskyPairRules, [id], ["acidity"], citrus.notes.map(note => note.noteSlug), allCategories(input.components))], sourceRuleIds: riskyPairRules, knowledgeClaimIds: claimIds,
      });
    }
  }

  if (hasRule(warningRuleIds, "profile.many-extremes")) {
    result.push({
      id: "recommendation.reduce-profile-overload", type: "REDUCE_PROFILE_OVERLOAD", priority: "MEDIUM", confidenceScore: 70, impactScore: 45,
      // ADR-015: unmeasured (null) secondary fields cannot be "extreme" - excluded before the >=8 check.
      componentIds: [], characteristicKeys: Object.entries(input.mixProfile.profile).filter(([, value]) => value !== null && value >= 8).map(([key]) => key as keyof typeof input.mixProfile.profile).sort(), noteIds: [], categoryIds: allCategories(input.components),
      action: { type: "REDUCE_PROFILE_OVERLOAD", characteristicKeys: Object.entries(input.mixProfile.profile).filter(([, value]) => value !== null && value >= 8).map(([key]) => key as keyof typeof input.mixProfile.profile).sort() },
      reasons: [makeReason("MULTIPLE_PROFILE_EXTREMES", ["profile.many-extremes"], [], [], [], allCategories(input.components))], sourceRuleIds: ["profile.many-extremes"], knowledgeClaimIds: [],
    });
  }
  return result;
};
