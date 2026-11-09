import type { CanonicalMixComponentInput } from "../canonical-mix-scoring";
import { toKnowledgeCategory } from "../flavor-knowledge/note-taxonomy";
import type { FlavorNoteCategory } from "../flavor-knowledge";
import { FLAVOR_PROFILE_FIELDS } from "../flavors/types";
import { calculateMixAnalysis } from "../mix-analysis";
import type { MixAnalysisResult } from "../mix-analysis";
import { mapVerifiedMixRecipeToPublic } from "../verified-mix-recipe";
import type { VerifiedMixRecipe } from "../verified-mix-recipe";
import { buildCanonicalMixInputFromVerifiedRecipe } from "./adapter";
import type {
  PublicVerifiedRecipeAnalysis,
  VerifiedRecipeAnalysis,
  VerifiedRecipeComponentContribution,
  VerifiedRecipeDataCoverage,
  VerifiedRecipeExplainability,
  VerifiedRecipeFlavorSummary,
} from "./types";

const unique = <T>(items: readonly T[]): readonly T[] => [...new Set(items)];
const knowledgeCategories = (notes: readonly { readonly category: Parameters<typeof toKnowledgeCategory>[0] }[]): readonly FlavorNoteCategory[] =>
  unique(notes.map(note => toKnowledgeCategory(note.category)).filter((category): category is FlavorNoteCategory => Boolean(category)));

const recipeSmokeScore = (recipe: VerifiedMixRecipe): number | null => {
  const score = recipe.evaluation?.numericRating ?? null;
  return score !== null && Number.isFinite(score) && score >= 0 && score <= 10 ? score : null;
};

const publicAnalysis = (analysis: MixAnalysisResult): PublicVerifiedRecipeAnalysis => ({
  mixProfile: analysis.mixProfile,
  compatibility: analysis.compatibility,
  recommendations: analysis.recommendations,
  predictedQualityScore: analysis.scoring.predictedQualityScore,
  predictionConfidenceScore: analysis.scoring.predictionConfidence.score,
  predictionConfidenceLabel: analysis.scoring.predictionConfidence.finalConfidenceLabel,
  dataQuality: analysis.scoring.dataQuality,
  riskScore: analysis.scoring.scoreBreakdown.risks,
  proposalComparison: analysis.proposalComparison ? {
    accepted: analysis.proposalComparison.accepted,
    targetRiskReduced: analysis.proposalComparison.targetRiskReduced,
    rejectionReasons: analysis.proposalComparison.rejectionReasons,
  } : null,
  engineVersions: {
    canonicalMixScoring: analysis.scoring.version,
    mixProfile: analysis.mixProfile.metadata.calculationVersion,
    compatibility: analysis.compatibility.metadata.calculationVersion,
    recommendation: analysis.recommendations.version,
  },
});

const flavorSummary = (analysis: MixAnalysisResult): VerifiedRecipeFlavorSummary => ({
  sweetness: analysis.mixProfile.profile.sweetness,
  sourness: analysis.mixProfile.profile.acidity,
  acidity: analysis.mixProfile.profile.acidity,
  freshness: analysis.mixProfile.profile.freshness,
  intensity: analysis.mixProfile.profile.intensity,
  strength: analysis.mixProfile.profile.strength,
  heatResistance: analysis.mixProfile.profile.heatResistance,
  juiciness: analysis.mixProfile.profile.juiciness,
  dominantCategories: knowledgeCategories(analysis.mixProfile.dominantNotes),
  secondaryCategories: knowledgeCategories(analysis.mixProfile.secondaryNotes),
  dominantComponentId: String(analysis.mixProfile.dominantComponent.flavorId),
  dominantInfluenceShare: analysis.mixProfile.dominantComponent.influenceShare,
  dominanceLevel: analysis.mixProfile.dominanceLevel,
});

const contributionFor = (
  analysis: MixAnalysisResult,
  recipe: VerifiedMixRecipe,
): readonly VerifiedRecipeComponentContribution[] => {
  const influences = [analysis.mixProfile.dominantComponent, ...analysis.mixProfile.secondaryComponents];
  return analysis.canonicalMix.components.map(component => {
    const influence = influences.find(item => String(item.flavorId) === String(component.flavorId));
    const recipeComponent = recipe.components.find(item => item.canonicalProductId === component.resolution.canonicalProductId);
    const categories = knowledgeCategories(component.effectiveProfile.notes);
    const contributedParameters = FLAVOR_PROFILE_FIELDS.flatMap(field => {
      const parameter = component.effectiveProfile.parameters[field];
      if (parameter.value === null || (parameter.source !== "CANONICAL_PRODUCT_PROFILE" && parameter.source !== "CANONICAL_TECHNICAL_PROFILE")) return [];
      return [{ field, value: parameter.value, source: parameter.source }];
    });
    return {
      canonicalProduct: {
        canonicalProductId: String(component.flavorId),
        manufacturer: component.resolution.canonicalManufacturer ?? component.brandName,
        productLine: component.resolution.canonicalProductLine,
        productName: component.resolution.canonicalProductName ?? component.flavorName,
      },
      percentage: component.percentage,
      influenceScore: influence?.influenceScore ?? 0,
      influenceShare: influence?.influenceShare ?? 0,
      sourceStatedRole: recipeComponent?.roleOrigin === "SOURCE_STATED" ? recipeComponent.role : null,
      recordedRole: recipeComponent?.role ?? null,
      roleOrigin: recipeComponent?.roleOrigin ?? null,
      // The existing engine does not compute a factual current component role. Suggested roles
      // belong only to a predicted recommendation and must not be presented as recipe facts.
      inferredRole: null,
      dominantCategories: categories,
      contributedParameters,
    };
  });
};

const coverageFor = (analysis: MixAnalysisResult, inputs: readonly CanonicalMixComponentInput[]): VerifiedRecipeDataCoverage => {
  const profile = analysis.mixProfile.profile;
  const filledProfileDimensions = FLAVOR_PROFILE_FIELDS.filter(field => profile[field] !== null);
  const nullProfileDimensions = FLAVOR_PROFILE_FIELDS.filter(field => profile[field] === null);
  const productProfileComponentCount = inputs.filter(input => input.profileCandidates?.some(candidate => candidate.type === "CANONICAL_PRODUCT_PROFILE")).length;
  return {
    canonicalIdentityCoverage: analysis.canonicalMix.components.length ? 100 : 0,
    productProfileCoverage: inputs.length ? Math.round(productProfileComponentCount / inputs.length * 1000) / 10 : 0,
    productProfileComponentCount,
    componentCount: inputs.length,
    filledProfileDimensions,
    nullProfileDimensions,
    fallbackComponentCount: analysis.canonicalMix.components.filter(component => component.effectiveProfile.usedFallback).length,
  };
};

const explainabilityFor = (analysis: MixAnalysisResult): VerifiedRecipeExplainability => ({
  positiveFactors: analysis.compatibility.positiveFactors.map(factor => ({ category: factor.category, title: factor.title, description: factor.description, impact: factor.impact })),
  risks: analysis.compatibility.conflicts.map(conflict => ({ severity: conflict.severity, title: conflict.title, description: conflict.description, impact: conflict.scoreImpact })),
});

export const calculateVerifiedRecipeAnalysis = (recipe: VerifiedMixRecipe): VerifiedRecipeAnalysis => {
  const components = buildCanonicalMixInputFromVerifiedRecipe(recipe);
  const analysis = calculateMixAnalysis({ components, verifiedSmokeScore: recipeSmokeScore(recipe) });
  const publicRecipe = mapVerifiedMixRecipeToPublic(recipe);
  return {
    recipeId: recipe.recipeId,
    recipe: publicRecipe,
    analysis: publicAnalysis(analysis),
    flavorSummary: flavorSummary(analysis),
    components: contributionFor(analysis, recipe),
    coverage: coverageFor(analysis, components),
    explainability: explainabilityFor(analysis),
    predicted: {
      qualityScore: analysis.scoring.predictedQualityScore,
      confidenceScore: analysis.scoring.predictionConfidence.score,
      compatibilityScore: analysis.compatibility.compatibilityScore,
      riskScore: analysis.scoring.scoreBreakdown.risks,
      recommendationsArePredictedAlternatives: true,
    },
    observed: {
      smokeScore: analysis.scoring.verifiedSmokeScore,
      evaluation: publicRecipe.evaluation,
      hasObservedEvaluation: publicRecipe.evaluation !== null,
    },
    metadata: { calculationVersion: "verified-mix-analysis-v1" },
  };
};
