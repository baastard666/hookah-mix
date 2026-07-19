import { MAX_RECOMMENDATIONS, clamp, round } from "./constants";
import { componentId, rankRecommendations } from "./helpers";
import type { MixRecommendation, RecommendationComponentInput, SuggestedMixVariant } from "./types";

const targetFrom = (recommendation: MixRecommendation): { componentId: string; target: number } | undefined => {
  const action = recommendation.action;
  if (action.type === "DECREASE_COMPONENT" || action.type === "INCREASE_COMPONENT") return { componentId: action.componentId, target: round((action.suggestedPercentageRange.min + action.suggestedPercentageRange.max) / 2, 1) };
  if (action.type === "REBALANCE_COMPONENTS" && action.primaryComponentId && action.adjustments.length) {
    const adjustment = action.adjustments.find(item => item.componentId === action.primaryComponentId) ?? action.adjustments[0];
    return { componentId: adjustment.componentId, target: round((adjustment.suggestedPercentageRange.min + adjustment.suggestedPercentageRange.max) / 2, 1) };
  }
  return undefined;
};

export const buildSuggestedMixVariant = (components: readonly RecommendationComponentInput[], recommendations: readonly MixRecommendation[]): SuggestedMixVariant | undefined => {
  const selected = recommendations.map(recommendation => ({ recommendation, target: targetFrom(recommendation) })).find(item => item.target);
  if (!selected?.target) return undefined;
  const ordered = [...components].sort((a, b) => componentId(a.flavorId).localeCompare(componentId(b.flavorId), "en"));
  const targetComponent = ordered.find(item => componentId(item.flavorId) === selected.target?.componentId);
  if (!targetComponent) return undefined;
  const target = clamp(selected.target.target, 1, 99);
  const delta = target - targetComponent.percentage;
  if (Math.abs(delta) < 0.0001) return undefined;
  const others = ordered.filter(item => componentId(item.flavorId) !== selected.target?.componentId);
  const otherTotal = others.reduce((sum, item) => sum + item.percentage, 0);
  if (otherTotal <= 0) return undefined;
  const suggested = new Map<string, number>();
  suggested.set(componentId(targetComponent.flavorId), target);
  others.forEach(item => suggested.set(componentId(item.flavorId), round(item.percentage - delta * item.percentage / otherTotal, 1)));
  const donor = [...others].sort((a, b) => b.percentage - a.percentage || componentId(a.flavorId).localeCompare(componentId(b.flavorId), "en"))[0];
  const total = [...suggested.values()].reduce((sum, value) => sum + value, 0);
  suggested.set(componentId(donor.flavorId), round((suggested.get(componentId(donor.flavorId)) ?? 0) + (100 - total), 1));
  if ([...suggested.values()].some(value => value < 1 || value > 99)) return undefined;
  const variantComponents = ordered.map(item => ({ componentId: componentId(item.flavorId), currentPercentage: item.percentage, suggestedPercentage: suggested.get(componentId(item.flavorId)) ?? item.percentage }));
  if (round(variantComponents.reduce((sum, item) => sum + item.suggestedPercentage, 0), 1) !== 100) return undefined;
  return { components: variantComponents, totalPercentage: 100, basedOnRecommendationIds: [selected.recommendation.id] };
};

export const finalizeRecommendations = (items: readonly MixRecommendation[]): MixRecommendation[] => rankRecommendations(items).slice(0, MAX_RECOMMENDATIONS);
