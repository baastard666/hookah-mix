import { MIX_SCORE_WEIGHTS, round } from "../canonical-mix-scoring/constants";
import { groupCompatibilityRisks } from "../canonical-mix-scoring/risk-groups";
import { buildCanonicalMixInputFromVerifiedRecipe } from "../verified-mix-analysis";
import type { VerifiedMixRecipe } from "../verified-mix-recipe";
import { calculateMixAnalysis } from "../mix-analysis";
import type { MixAnalysisResult } from "../mix-analysis";
import type { GoldSetScenario, NumericDistribution, ScoringAuditRecord, ScoreDecomposition, SimulationSummary } from "./types";

const numeric = (values: readonly number[]): NumericDistribution => {
  if (!values.length) return { min: null, max: null, mean: null, median: null, p25: null, p75: null, standardDeviation: null };
  const ordered = [...values].sort((a, b) => a - b);
  const quantile = (position: number): number => { const index = (ordered.length - 1) * position; const low = Math.floor(index); const high = Math.ceil(index); return round(ordered[low] + (ordered[high] - ordered[low]) * (index - low), 1); };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return { min: ordered[0], max: ordered.at(-1) ?? null, mean: round(mean, 1), median: quantile(.5), p25: quantile(.25), p75: quantile(.75), standardDeviation: round(Math.sqrt(variance), 2) };
};

export const decomposeCurrentScore = (analysis: MixAnalysisResult): ScoreDecomposition => {
  const blockValues = analysis.scoring.scoreBreakdown;
  const baseWeights = { ...MIX_SCORE_WEIGHTS } as Record<string, number>;
  const activeBlocks = Object.keys(baseWeights).filter(key => blockValues[key as keyof typeof blockValues] !== null);
  const excludedBlocks = Object.keys(baseWeights).filter(key => !activeBlocks.includes(key));
  const activeWeightTotal = activeBlocks.reduce((sum, key) => sum + baseWeights[key], 0);
  const effectiveWeights = Object.fromEntries(activeBlocks.map(key => [key, round(baseWeights[key] / activeWeightTotal, 4)]));
  const contributions = Object.fromEntries(activeBlocks.map(key => [key, round((blockValues[key as keyof typeof blockValues] as number) * effectiveWeights[key], 4)]));
  return {
    blockValues,
    baseWeights,
    activeBlocks,
    excludedBlocks,
    activeWeightTotal: round(activeWeightTotal, 4),
    effectiveWeights,
    contributions,
    scoreEvidenceCoverage: round(activeWeightTotal * 100, 1),
    knownRiskCount: groupCompatibilityRisks(analysis.compatibility).length,
  };
};

export const auditAnalysis = (id: string, title: string, scenarioClass: string, analysis: MixAnalysisResult): ScoringAuditRecord => ({
  id,
  title,
  scenarioClass,
  predictedQualityScore: analysis.scoring.predictedQualityScore,
  compatibilityScore: analysis.compatibility.compatibilityScore,
  proportionsScore: analysis.scoring.scoreBreakdown.proportions,
  componentQualityScore: analysis.scoring.scoreBreakdown.componentQuality,
  balanceScore: analysis.scoring.scoreBreakdown.balance,
  riskScore: analysis.scoring.scoreBreakdown.risks,
  confirmationsScore: analysis.scoring.scoreBreakdown.confirmations,
  identityCoverage: analysis.scoring.predictionConfidence.identityCoverage,
  profileCoverage: analysis.scoring.predictionConfidence.profileCoverage,
  dataQuality: analysis.scoring.dataQuality,
  confidenceScore: analysis.scoring.predictionConfidence.score,
  confidenceLabel: analysis.scoring.predictionConfidence.finalConfidenceLabel,
  decomposition: decomposeCurrentScore(analysis),
  warnings: analysis.compatibility.warnings.map(item => item.ruleId).sort(),
  conflicts: analysis.compatibility.conflicts.map(item => item.ruleId).sort(),
});

export const auditGoldSet = (scenarios: readonly GoldSetScenario[]): readonly ScoringAuditRecord[] => scenarios.map(scenario =>
  auditAnalysis(scenario.id, scenario.title, scenario.scenarioClass, calculateMixAnalysis({ components: scenario.components }))).sort((a, b) => a.id.localeCompare(b.id, "en"));

export const auditVerifiedRecipes = (recipes: readonly VerifiedMixRecipe[]): readonly ScoringAuditRecord[] => recipes.map(recipe => {
  const analysis = calculateMixAnalysis({ components: buildCanonicalMixInputFromVerifiedRecipe(recipe) });
  return auditAnalysis(recipe.recipeId, `Verified recipe ${recipe.recipeId}`, "VERIFIED_RECIPE", analysis);
}).sort((a, b) => a.id.localeCompare(b.id, "en"));

const displayUnderProfileGate = (record: ScoringAuditRecord, threshold: number): boolean => record.profileCoverage >= threshold;
const summaryFor = (option: SimulationSummary["option"], description: string, scenarios: readonly ScoringAuditRecord[], recipes: readonly ScoringAuditRecord[], display: (record: ScoringAuditRecord) => boolean, displayedScore: (record: ScoringAuditRecord) => number | null = record => record.predictedQualityScore): SimulationSummary => {
  const summarize = (records: readonly ScoringAuditRecord[]) => { const shown = records.filter(display); return { displayed: shown.length, suppressed: records.length - shown.length, scoreDistribution: numeric(shown.map(displayedScore).filter((value): value is number => value !== null)) }; };
  const jentCases = scenarios.filter(record => record.id.startsWith("jent-")).map(record => ({ id: record.id, displayed: display(record), label: display(record) ? "показана с disclosure" : "скрыта: недостаточно sensory evidence", displayedScore: display(record) ? displayedScore(record) : null }));
  return { option, description, recipes: summarize(recipes), scenarios: summarize(scenarios), jentCases };
};

export const simulateScoringSemantics = (scenarios: readonly ScoringAuditRecord[], recipes: readonly ScoringAuditRecord[]): readonly SimulationSummary[] => [
  summaryFor("A", "Current score remains visible; sparse profile receives structural-score disclosure.", scenarios, recipes, () => true),
  summaryFor("B", "Illustrative profile-evidence gate at 50%; sensitivity threshold, not a production recommendation.", scenarios, recipes, record => displayUnderProfileGate(record, 50)),
  summaryFor("C", "Separate axes: compatibility/evidence always visible; overall score is withheld below the same 50% illustrative profile gate.", scenarios, recipes, record => displayUnderProfileGate(record, 50)),
  summaryFor("D", "Research-only confidence-aware display: score × (0.5 + confidence/200); deliberately mixes estimate and confidence and is not recommended automatically.", scenarios, recipes, () => true, record => round(record.predictedQualityScore * (.5 + record.confidenceScore / 200), 1)),
];

export const distributionForAuditRecords = (records: readonly ScoringAuditRecord[]) => ({
  predictedQualityScore: numeric(records.map(record => record.predictedQualityScore)),
  compatibilityScore: numeric(records.map(record => record.compatibilityScore)),
  profileCoverage: numeric(records.map(record => record.profileCoverage)),
  confidenceScore: numeric(records.map(record => record.confidenceScore)),
  dataQuality: numeric(records.map(record => record.dataQuality)),
});
