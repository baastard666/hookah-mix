import { FLAVOR_PROFILE_FIELDS } from "../flavors/types";
import type { FlavorProfileField } from "../flavors/types";
import type { VerifiedMixRecipe } from "../verified-mix-recipe";
import { calculateVerifiedRecipeAnalysis } from "./calculate-verified-recipe-analysis";
import type { VerifiedMixAnalysisAudit, VerifiedMixAnalysisAuditRecord, VerifiedMixAnalysisDistribution } from "./types";

const round = (value: number, digits = 1): number => Math.round((value + Number.EPSILON) * 10 ** digits) / 10 ** digits;
const numericDistribution = (values: readonly number[]): VerifiedMixAnalysisDistribution => {
  if (!values.length) return { min: null, max: null, mean: null, median: null, p25: null, p75: null };
  const ordered = [...values].sort((left, right) => left - right);
  const quantile = (position: number): number => {
    const index = (ordered.length - 1) * position;
    const lower = Math.floor(index); const upper = Math.ceil(index);
    return round(ordered[lower] + (ordered[upper] - ordered[lower]) * (index - lower));
  };
  return { min: ordered[0], max: ordered.at(-1) ?? null, mean: round(ordered.reduce((sum, value) => sum + value, 0) / ordered.length), median: quantile(0.5), p25: quantile(0.25), p75: quantile(0.75) };
};

const emptyConfidenceLabels = (): Record<"Предварительная" | "Средняя" | "Высокая" | "Подтверждённая", number> => ({ "Предварительная": 0, "Средняя": 0, "Высокая": 0, "Подтверждённая": 0 });
const publicPrivacyIssues = (value: unknown): readonly string[] => {
  const serialized = JSON.stringify(value);
  return ["sourceRecordId", "evidenceId", "sourceRow", "workbookPath", "privateUrl", "decisionId", "debugReasons"].filter(token => serialized.includes(token));
};

export const createVerifiedMixAnalysisAudit = (recipes: readonly VerifiedMixRecipe[]): VerifiedMixAnalysisAudit => {
  const records: VerifiedMixAnalysisAuditRecord[] = [];
  const failures: { recipeId: string; code: string }[] = [];
  const privacyIssues = new Set<string>();
  const confidenceLabels = emptyConfidenceLabels();
  let fallbackComponents = 0;
  let profileCoveredComponents = 0;
  let totalComponents = 0;
  let recommendations = 0;
  let acceptedVariants = 0;
  let unchanged = 0;
  let rejectedProposals = 0;
  for (const recipe of [...recipes].sort((left, right) => left.recipeId.localeCompare(right.recipeId, "en"))) {
    try {
      const result = calculateVerifiedRecipeAnalysis(recipe);
      const repeated = calculateVerifiedRecipeAnalysis(recipe);
      if (JSON.stringify(result) !== JSON.stringify(repeated)) throw new Error("NON_DETERMINISTIC_ANALYSIS");
      if (Math.abs(result.components.reduce((sum, component) => sum + component.percentage, 0) - 100) > 0.0001) throw new Error("INVALID_PERCENTAGE_TOTAL");
      publicPrivacyIssues(result).forEach(issue => privacyIssues.add(issue));
      const record: VerifiedMixAnalysisAuditRecord = {
        recipeId: recipe.recipeId,
        componentCount: result.components.length,
        percentages: result.components.map(component => component.percentage),
        canonicalCoverage: result.coverage.canonicalIdentityCoverage,
        productProfileCoverage: result.coverage.productProfileCoverage,
        fallbackComponentCount: result.coverage.fallbackComponentCount,
        filledProfileDimensions: result.coverage.filledProfileDimensions,
        nullDimensions: result.coverage.nullProfileDimensions,
        predictedQualityScore: result.predicted.qualityScore,
        predictionConfidenceScore: result.predicted.confidenceScore,
        confidenceLabel: result.analysis.predictionConfidenceLabel,
        dataQuality: result.analysis.dataQuality,
        compatibilityScore: result.predicted.compatibilityScore,
        riskScore: result.predicted.riskScore,
        dominantComponentId: result.flavorSummary.dominantComponentId,
        dominantInfluenceShare: result.flavorSummary.dominantInfluenceShare,
        dominantCategories: result.flavorSummary.dominantCategories,
        recommendationCount: result.analysis.recommendations.recommendations.length,
        acceptedProposal: result.analysis.proposalComparison?.accepted ?? false,
        warnings: result.analysis.compatibility.warnings.map(item => item.title),
      };
      records.push(record);
      totalComponents += result.components.length;
      profileCoveredComponents += result.coverage.productProfileComponentCount;
      fallbackComponents += result.coverage.fallbackComponentCount;
      confidenceLabels[result.analysis.predictionConfidenceLabel] += 1;
      if (record.recommendationCount > 0) recommendations += 1;
      const comparison = result.analysis.proposalComparison;
      if (comparison?.accepted) acceptedVariants += 1;
      else if (comparison) rejectedProposals += 1;
      if (record.recommendationCount === 0) unchanged += 1;
    } catch (error) {
      failures.push({ recipeId: recipe.recipeId, code: error instanceof Error ? error.message : "UNKNOWN_ANALYSIS_ERROR" });
    }
  }
  const fieldCounts = Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, 0])) as Record<FlavorProfileField, number>;
  records.forEach(record => record.nullDimensions.forEach(field => { fieldCounts[field] += 1; }));
  const scores = records.map(record => record.predictedQualityScore);
  const median = numericDistribution(scores).median;
  const scoreCounts = new Map<number, number>(); scores.forEach(score => scoreCounts.set(score, (scoreCounts.get(score) ?? 0) + 1));
  return {
    version: "verified-mix-analysis-audit-v1",
    recipesAnalyzed: records.length,
    failures: failures.sort((left, right) => left.recipeId.localeCompare(right.recipeId, "en")),
    totalComponents,
    productProfileCoverage: totalComponents ? round(profileCoveredComponents / totalComponents * 100) : 0,
    fallbackComponents,
    nullDimensionCounts: fieldCounts,
    predictedQualityScore: numericDistribution(scores),
    predictionConfidenceScore: numericDistribution(records.map(record => record.predictionConfidenceScore)),
    dataQuality: numericDistribution(records.map(record => record.dataQuality)),
    compatibilityScore: numericDistribution(records.map(record => record.compatibilityScore)),
    riskScore: numericDistribution(records.map(record => record.riskScore)),
    confidenceLabels,
    duplicatePredictedScores: [...scoreCounts.entries()].filter(([, count]) => count > 1).map(([score, count]) => ({ score, count })).sort((left, right) => left.score - right.score),
    withinPointTwoOfMedian: median === null ? 0 : scores.filter(score => Math.abs(score - median) <= 0.2).length,
    recipesWithFallback: records.filter(record => record.fallbackComponentCount > 0).length,
    recommendations: { withRecommendations: recommendations, acceptedVariants, unchanged, rejectedProposals },
    records: records.sort((left, right) => left.recipeId.localeCompare(right.recipeId, "en")),
    privacyIssues: [...privacyIssues].sort((left, right) => left.localeCompare(right, "en")),
  };
};
