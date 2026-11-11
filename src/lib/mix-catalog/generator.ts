import type { VerifiedRecipeAnalysis } from "../verified-mix-analysis";
import { categoryLabels } from "../flavor-knowledge";
import { MIX_CATALOG_SCHEMA_VERSION } from "./types";
import type { MixCatalogItem, MixCatalogSnapshot } from "./types";
import { createMixCatalogSlug } from "./slug";

const recommendationText = (recommendation: VerifiedRecipeAnalysis["analysis"]["recommendations"]["recommendations"][number]): string => {
  const action = recommendation.action;
  if (action.type === "PRESERVE_CURRENT_MIX") return "Система не предлагает менять исходный баланс.";
  if (action.type === "INSUFFICIENT_DATA") return "Для более точной корректировки пока недостаточно профильных данных.";
  if (action.type === "DECREASE_COMPONENT") return `Снизить долю компонента до диапазона ${action.suggestedPercentageRange.min}–${action.suggestedPercentageRange.max}%.`;
  if (action.type === "INCREASE_COMPONENT") return `Повысить долю компонента до диапазона ${action.suggestedPercentageRange.min}–${action.suggestedPercentageRange.max}%.`;
  if (action.type === "REBALANCE_COMPONENTS") return "Система предлагает перераспределить доли компонентов.";
  if (action.type === "REMOVE_COMPONENT") return "Система предлагает убрать один из компонентов из альтернативного варианта.";
  if (action.type === "ADD_NOTE_DIRECTION") return "Система предлагает дополнительное вкусовое направление для альтернативного варианта.";
  return "Система отмечает возможную перегрузку профиля в альтернативном варианте.";
};

const publicCategoryPair = (title: string, description: string): { readonly title: string; readonly description: string } => {
  const match = /^category\.([a-z]+)-([a-z]+)$/.exec(title);
  if (!match) return { title, description };
  const labels = match.slice(1).map(value => categoryLabels[value.toUpperCase() as keyof typeof categoryLabels] ?? value);
  const relation = description.includes("STRONG_MATCH")
    ? "Эти вкусовые направления хорошо поддерживают друг друга."
    : description.includes("GOOD_MATCH")
      ? "Эти вкусовые направления сочетаются в текущих пропорциях."
      : "Эти вкусовые направления могут дополнять друг друга в текущих пропорциях.";
  return { title: `${labels[0]} и ${labels[1]}`, description: relation };
};

const itemFromAnalysis = (analysis: VerifiedRecipeAnalysis): MixCatalogItem => {
  const suggestedVariant = analysis.analysis.proposalComparison?.accepted && analysis.analysis.recommendations.summary.suggestedMixVariant
    ? { components: analysis.analysis.recommendations.summary.suggestedMixVariant.components.map(component => ({ canonicalProductId: component.componentId, currentPercentage: component.currentPercentage, suggestedPercentage: component.suggestedPercentage })) }
    : null;
  const preparation = analysis.recipe.preparation
    ? { bowlType: analysis.recipe.preparation.bowl?.type ?? null, warmupMinutes: analysis.recipe.preparation.warmupMinutes ?? null, coalCount: analysis.recipe.preparation.coals?.workingCount ?? analysis.recipe.preparation.coals?.initialCount ?? null }
    : null;
  return {
    recipeId: analysis.recipeId,
    slug: createMixCatalogSlug(analysis.recipe.title, analysis.recipeId),
    title: analysis.recipe.title,
    componentCount: analysis.components.length,
    components: analysis.components.map(component => ({
      canonicalProductId: component.canonicalProduct.canonicalProductId,
      manufacturer: component.canonicalProduct.manufacturer,
      productLine: component.canonicalProduct.productLine,
      productName: component.canonicalProduct.productName,
      percentage: component.percentage,
      sourceStatedRole: component.sourceStatedRole,
      recordedRole: component.recordedRole,
      influenceScore: component.influenceScore,
      influenceShare: component.influenceShare,
      dominantCategories: component.dominantCategories,
      contributedParameters: component.contributedParameters,
    })),
    tags: analysis.recipe.tags,
    dominantCategories: analysis.flavorSummary.dominantCategories,
    secondaryCategories: analysis.flavorSummary.secondaryCategories,
    profile: {
      sweetness: analysis.flavorSummary.sweetness,
      sourness: analysis.flavorSummary.sourness,
      freshness: analysis.flavorSummary.freshness,
      intensity: analysis.flavorSummary.intensity,
      strength: analysis.flavorSummary.strength,
      heatResistance: analysis.flavorSummary.heatResistance,
      juiciness: analysis.flavorSummary.juiciness,
    },
    dominance: { canonicalProductId: analysis.flavorSummary.dominantComponentId, influenceShare: analysis.flavorSummary.dominantInfluenceShare, level: analysis.flavorSummary.dominanceLevel },
    predicted: { qualityScore: analysis.predicted.publicQualityScore, predictionReadiness: analysis.predicted.predictionReadiness, compatibilityScore: analysis.predicted.compatibilityScore },
    explainability: {
      positiveFactors: analysis.explainability.positiveFactors.map(factor => ({ ...factor, ...publicCategoryPair(factor.title, factor.description) })),
      risks: analysis.explainability.risks,
    },
    recommendations: analysis.analysis.recommendations.recommendations.map(recommendation => ({ type: recommendation.type, priority: recommendation.priority, text: recommendationText(recommendation) })),
    suggestedVariant,
    observed: { smokeScore: analysis.observed.smokeScore, hasObservedEvaluation: analysis.observed.hasObservedEvaluation, evaluation: analysis.observed.evaluation ? { verdict: analysis.observed.evaluation.verdict, numericRating: analysis.observed.evaluation.numericRating } : null },
    preparation,
    engineVersions: { ...analysis.analysis.engineVersions, analysis: analysis.metadata.calculationVersion },
  };
};

export const createVerifiedMixCatalogSnapshot = (analyses: readonly VerifiedRecipeAnalysis[]): MixCatalogSnapshot => ({
  schemaVersion: MIX_CATALOG_SCHEMA_VERSION,
  items: analyses.map(itemFromAnalysis).sort((left, right) => left.slug.localeCompare(right.slug, "en")),
});
