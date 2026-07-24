import { THRESHOLDS } from "./constants";
import { allCategories, componentCategories, componentId, confidenceFor, decreaseRange, findComponent, hasRule, increaseRange, makeReason, range, relatedComponentIds, rules } from "./helpers";
import type { MixRecommendation, MixRecommendationInput, RecommendationComponentInput } from "./types";
import { getCategoryRelation } from "../flavor-knowledge";
import { resolveIntensity } from "../flavors/types";

const dataConfidence = (components: readonly RecommendationComponentInput[]) => components.reduce((sum, item) => sum + (item.dataConfidenceScore ?? 80), 0) / components.length;
const warningRules = (input: MixRecommendationInput) => rules(input.compatibility.warnings);

const decrease = (component: RecommendationComponentInput, ruleIds: readonly string[], reasonCode: "DOMINANT_COMPONENT_OVERUSED" | "FLORAL_OVERLOAD", confidence: number, accent = false): MixRecommendation => {
  const id = componentId(component.flavorId);
  const categories = componentCategories(component);
  return {
    id: `recommendation.decrease.${id}.${reasonCode.toLowerCase()}`, type: "DECREASE_COMPONENT", priority: "HIGH",
    confidenceScore: confidenceFor(confidence, ruleIds, [], true), impactScore: accent ? 75 : 65,
    componentIds: [id], characteristicKeys: accent ? ["floralLevel", "intensity"] : ["intensity"], noteIds: component.notes.map(note => note.noteSlug).sort(), categoryIds: categories,
    action: { type: "DECREASE_COMPONENT", componentId: id, currentPercentage: component.percentage, suggestedPercentageRange: decreaseRange(component, accent), suggestedRole: accent ? "ACCENT" : "SUPPORT" },
    reasons: [makeReason(reasonCode, ruleIds, [id], accent ? ["floralLevel", "intensity"] : ["intensity"], component.notes.map(note => note.noteSlug), categories, { currentPercentage: component.percentage, intensity: component.profile.intensity })],
    sourceRuleIds: [...ruleIds], knowledgeClaimIds: [],
  };
};

export const calculateDominanceRecommendations = (input: MixRecommendationInput): MixRecommendation[] => {
  const result: MixRecommendation[] = [];
  const confidence = dataConfidence(input.components);
  const allWarningRules = warningRules(input);
  const dominanceFactors = input.compatibility.warnings.filter(item => item.ruleId === "intensity.overdominant" || item.ruleId.startsWith("proportion.bright-large.") || item.ruleId.startsWith("proportion.influence-gap."));
  for (const id of relatedComponentIds(dominanceFactors)) {
    const component = findComponent(input.components, id);
    if (!component) continue;
    const baseCategories = componentCategories(component);
    const hasSafeAccent = input.components.some(item => {
      if (componentId(item.flavorId) === id || item.percentage < 5 || item.percentage > 10 || resolveIntensity(item.profile.intensity) < THRESHOLDS.intense) return false;
      return baseCategories.every(base => componentCategories(item).every(accent => !["RISKY", "CONFLICT"].includes(getCategoryRelation(base, accent).type)));
    });
    const intentionalBaseAndAccent = component.percentage >= 85 && resolveIntensity(component.profile.intensity) < THRESHOLDS.intense && hasSafeAccent;
    if (component.percentage > THRESHOLDS.weakPercentage && !intentionalBaseAndAccent) result.push(decrease(component, rules(dominanceFactors.filter(item => item.relatedComponents.map(componentId).includes(id))), "DOMINANT_COMPONENT_OVERUSED", confidence));
  }

  for (const component of input.components) {
    const categories = componentCategories(component);
    const floralConfirmed = hasRule(allWarningRules, "profile.floral-spice") || hasRule(allWarningRules, "intensity.bright-competition") || hasRule(allWarningRules, `proportion.bright-large.${componentId(component.flavorId)}`);
    if (categories.includes("FLORAL") && resolveIntensity(component.profile.intensity) >= THRESHOLDS.veryIntense && component.percentage >= THRESHOLDS.largeAccentPercentage) {
      const sourceRules = floralConfirmed ? allWarningRules.filter(id => id.includes("floral") || id.includes("bright")) : ["recommendation.floral-high-share"];
      result.push(decrease(component, sourceRules, "FLORAL_OVERLOAD", confidence, true));
    }
  }

  const weakFactors = input.compatibility.warnings.filter(item => item.ruleId.startsWith("intensity.lost.") || item.ruleId.startsWith("proportion.tiny.") || item.ruleId.startsWith("proportion.weak-small."));
  for (const id of relatedComponentIds(weakFactors)) {
    const component = findComponent(input.components, id);
    if (!component) continue;
    const categories = componentCategories(component);
    const otherNotes = new Set(input.components.filter(item => componentId(item.flavorId) !== id).flatMap(item => item.notes.map(note => note.noteSlug)));
    const duplicated = component.notes.length > 0 && component.notes.every(note => otherNotes.has(note.noteSlug));
    const sourceRules = rules(weakFactors.filter(item => item.relatedComponents.map(componentId).includes(id)));
    result.push(duplicated ? {
      id: `recommendation.remove.${id}`, type: "REMOVE_COMPONENT", priority: "MEDIUM", confidenceScore: confidenceFor(confidence, sourceRules, [], true), impactScore: 45,
      componentIds: [id], characteristicKeys: ["intensity"], noteIds: component.notes.map(note => note.noteSlug).sort(), categoryIds: categories,
      action: { type: "REMOVE_COMPONENT", componentId: id, currentPercentage: component.percentage },
      reasons: [makeReason("WEAK_COMPONENT_MAY_DISAPPEAR", sourceRules, [id], ["intensity"], component.notes.map(note => note.noteSlug), categories, { duplicatedDirection: true })], sourceRuleIds: sourceRules, knowledgeClaimIds: [],
    } : {
      id: `recommendation.increase.${id}`, type: "INCREASE_COMPONENT", priority: "MEDIUM", confidenceScore: confidenceFor(confidence, sourceRules, [], true), impactScore: 48,
      componentIds: [id], characteristicKeys: ["intensity"], noteIds: component.notes.map(note => note.noteSlug).sort(), categoryIds: categories,
      action: { type: "INCREASE_COMPONENT", componentId: id, currentPercentage: component.percentage, suggestedPercentageRange: increaseRange(component), suggestedRole: "ACCENT" },
      reasons: [makeReason("WEAK_COMPONENT_MAY_DISAPPEAR", sourceRules, [id], ["intensity"], component.notes.map(note => note.noteSlug), categories, { duplicatedDirection: false })], sourceRuleIds: sourceRules, knowledgeClaimIds: [],
    });
  }

  const competition = input.compatibility.warnings.filter(item => item.ruleId === "intensity.bright-competition" || item.ruleId === "proportion.bright-equal");
  if (competition.length) {
    const ids = relatedComponentIds(competition);
    const candidates = input.components.filter(item => ids.includes(componentId(item.flavorId))).sort((a, b) => b.percentage + resolveIntensity(b.profile.intensity) * 2 - (a.percentage + resolveIntensity(a.profile.intensity) * 2) || componentId(a.flavorId).localeCompare(componentId(b.flavorId), "en"));
    const base = candidates[0];
    result.push({
      id: "recommendation.rebalance.competing-bases", type: "REBALANCE_COMPONENTS", priority: "HIGH", confidenceScore: confidenceFor(confidence, rules(competition), [], candidates.length > 1), impactScore: 70,
      componentIds: ids, characteristicKeys: ["intensity"], noteIds: [], categoryIds: allCategories(candidates),
      action: { type: "REBALANCE_COMPONENTS", primaryComponentId: componentId(base.flavorId), adjustments: [{ componentId: componentId(base.flavorId), currentPercentage: base.percentage, suggestedPercentageRange: range(Math.max(55, base.percentage + 5), Math.max(60, base.percentage + 10)), suggestedRole: "BASE" }] },
      reasons: [makeReason("MULTIPLE_COMPETING_BASES", rules(competition), ids, ["intensity"], [], allCategories(candidates))], sourceRuleIds: rules(competition), knowledgeClaimIds: [],
    });
  }

  if (input.components.length >= 3 && Math.max(...input.components.map(item => item.percentage)) - Math.min(...input.components.map(item => item.percentage)) <= THRESHOLDS.equalPercentageTolerance && !competition.length) {
    const categories = input.components.map(componentCategories);
    const scored = input.components.map((component, index) => {
      const relationScore = categories[index].flatMap(category => categories.flatMap((items, other) => other === index ? [] : items.map(item => getCategoryRelation(category, item).baseScore))).reduce((sum, value) => sum + value, 0);
      return { component, score: component.percentage + resolveIntensity(component.profile.intensity) * 2 + relationScore * 5 };
    }).sort((a, b) => b.score - a.score || componentId(a.component.flavorId).localeCompare(componentId(b.component.flavorId), "en"));
    const clear = scored[0].score - scored[1].score >= 3;
    const base = scored[0].component;
    result.push({
      id: clear ? `recommendation.rebalance.base.${componentId(base.flavorId)}` : "recommendation.rebalance.no-clear-base", type: "REBALANCE_COMPONENTS", priority: "MEDIUM", confidenceScore: confidenceFor(confidence, ["recommendation.no-clear-base"], [], clear), impactScore: clear ? 45 : 30,
      componentIds: input.components.map(item => componentId(item.flavorId)).sort(), characteristicKeys: ["intensity"], noteIds: [], categoryIds: allCategories(input.components),
      action: { type: "REBALANCE_COMPONENTS", primaryComponentId: clear ? componentId(base.flavorId) : undefined, adjustments: clear ? [{ componentId: componentId(base.flavorId), currentPercentage: base.percentage, suggestedPercentageRange: range(40, 50), suggestedRole: "BASE" }] : [] },
      reasons: [makeReason("NO_CLEAR_BASE", ["recommendation.no-clear-base"], input.components.map(item => componentId(item.flavorId)), ["intensity"], [], allCategories(input.components), { candidateSelected: clear })], sourceRuleIds: ["recommendation.no-clear-base"], knowledgeClaimIds: [],
    });
  }
  return result;
};
