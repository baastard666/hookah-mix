import { FLAVOR_PROFILE_FIELDS } from "../flavors/types";
import type { FlavorProfile } from "../flavors/types";
import type { ExpertMixImportResult, NormalizedMixComponentStagingRecord } from "../expert-mix-knowledge-import";
import { calculateMixAnalysis } from "../mix-analysis";
import { round } from "./constants";
import type { CanonicalMixComponentInput, MixComponentResolutionStatus, PredictionConfidenceLabel } from "./types";

export type CanonicalMixScoringAuditReport = {
  readonly version: "canonical-mix-scoring-audit-v1";
  readonly processedMixes: number;
  readonly sourceComponents: number;
  readonly effectiveComponents: number;
  readonly resolutionCounts: Readonly<Record<MixComponentResolutionStatus, number>>;
  readonly resolvedPercentageByCount: number;
  readonly resolvedPercentageByWeight: number;
  readonly fullyResolvedMixes: number;
  readonly partiallyResolvedMixes: number;
  readonly unresolvedMixes: number;
  readonly duplicateCanonicalComponentGroups: number;
  readonly mergedDuplicateComponents: number;
  readonly scoreDistribution: { readonly min: number; readonly max: number; readonly average: number };
  readonly confidenceDistribution: Readonly<Record<PredictionConfidenceLabel, number>>;
  readonly verifiedSmokeScores: number;
  readonly purelyPredictedScores: number;
  readonly mixesWithAmbiguousComponents: readonly string[];
  readonly mixesWithUnresolvedComponents: readonly string[];
  readonly scoringErrors: readonly { readonly mixId: string; readonly code: string }[];
  readonly sumPreservationErrors: readonly string[];
  readonly componentPreservationErrors: readonly string[];
  readonly privacyViolations: readonly string[];
};

const neutral = Object.fromEntries(FLAVOR_PROFILE_FIELDS.map(field => [field, 5])) as FlavorProfile;
const percentages = (components: readonly NormalizedMixComponentStagingRecord[]): readonly number[] => {
  const raw = components.map(item => item.percentage ?? item.approximatePercentage ?? item.parts ?? item.grams ?? 0);
  const total = raw.reduce((sum, value) => sum + value, 0); if (total <= 0) return raw;
  const normalized = raw.map(value => round(value / total * 100, 6));
  if (normalized.length) normalized[normalized.length - 1] = round(100 - normalized.slice(0, -1).reduce((sum, value) => sum + value, 0), 6);
  return normalized;
};
const componentInput = (component: NormalizedMixComponentStagingRecord, percentage: number, proportionConfirmed: boolean): CanonicalMixComponentInput => ({
  flavorId: component.componentId, brandName: component.manufacturer ?? "Не указан", flavorName: component.productName ?? component.displayName, flavorSlug: component.componentId,
  percentage, profile: neutral, notes: [{ noteId: `placeholder:${component.componentId}`, noteName: component.productName ?? component.displayName, noteSlug: component.componentId, category: "OTHER", intensity: 5, noteType: "DOMINANT" }],
  identity: { sourceComponentId: component.componentId, sourceRow: { sheet: component.raw.sheet, rowNumber: component.raw.rowNumber }, mixId: component.mixId, rawManufacturer: component.manufacturer, rawProductLine: component.productLine, rawProductName: component.productName, canonicalProductId: component.explicitCanonicalProductId, sourceType: "WORKBOOK_COMPONENT", sourceStatus: component.identityStatus },
  sourceProfileAvailable: false, proportionConfirmed,
});
const emptyResolutionCounts = (): Record<MixComponentResolutionStatus, number> => ({ RESOLVED: 0, MANUFACTURER_ONLY: 0, AMBIGUOUS: 0, UNRESOLVED: 0 });
const emptyConfidence = (): Record<PredictionConfidenceLabel, number> => ({ "Предварительная": 0, "Средняя": 0, "Высокая": 0, "Подтверждённая": 0 });

export const createCanonicalMixScoringAudit = (imported: ExpertMixImportResult): CanonicalMixScoringAuditReport => {
  const mixes = imported.mixes.filter(mix => mix.status === "VERIFIED").sort((a, b) => a.mixId.localeCompare(b.mixId, "en"));
  const resolutionCounts = emptyResolutionCounts(); const confidenceDistribution = emptyConfidence(); const scores: number[] = [];
  const ambiguous = new Set<string>(); const unresolved = new Set<string>(); const errors: { mixId: string; code: string }[] = [];
  const sumErrors: string[] = []; const componentErrors: string[] = []; let sourceComponents = 0; let effectiveComponents = 0; let duplicateGroups = 0; let mergedDuplicates = 0; let resolvedWeight = 0; let totalWeight = 0; let full = 0; let partial = 0; let none = 0;
  for (const mix of mixes) {
    const source = imported.components.filter(item => item.mixId === mix.mixId).sort((a, b) => a.position - b.position); const shares = percentages(source); sourceComponents += source.length;
    try {
      const analysis = calculateMixAnalysis({ components: source.map((item, index) => componentInput(item, shares[index], Math.abs(shares.reduce((sum, value) => sum + value, 0) - 100) <= 0.0001)), verifiedSmokeScore: null });
      effectiveComponents += analysis.canonicalMix.effectiveComponentCount; duplicateGroups += analysis.canonicalMix.warnings.length; mergedDuplicates += analysis.canonicalMix.rawComponentCount - analysis.canonicalMix.effectiveComponentCount;
      if (analysis.scoring.componentResolutions.length !== source.length) componentErrors.push(mix.mixId);
      if (Math.abs(analysis.canonicalMix.totalPercentage - 100) > 0.0001) sumErrors.push(mix.mixId);
      let resolvedInMix = 0;
      for (const item of analysis.scoring.componentResolutions) {
        resolutionCounts[item.resolution.status] += 1; totalWeight += item.percentage;
        if (item.resolution.status === "RESOLVED") { resolvedInMix += 1; resolvedWeight += item.percentage; }
        if (item.resolution.status === "AMBIGUOUS") ambiguous.add(mix.mixId);
        if (item.resolution.status === "UNRESOLVED") unresolved.add(mix.mixId);
      }
      if (resolvedInMix === source.length) full += 1; else if (resolvedInMix === 0) none += 1; else partial += 1;
      const score = analysis.scoring.predictedQualityScore;
      if (!Number.isFinite(score) || score < 0 || score > 10) errors.push({ mixId: mix.mixId, code: "INVALID_PREDICTED_SCORE" }); else scores.push(score);
      confidenceDistribution[analysis.scoring.predictionConfidence.finalConfidenceLabel] += 1;
    } catch (error) { errors.push({ mixId: mix.mixId, code: error instanceof Error ? error.name : "UNKNOWN_SCORING_ERROR" }); }
  }
  const serialized = JSON.stringify({ mixes: mixes.map(item => item.mixId), ambiguous: [...ambiguous], unresolved: [...unresolved], errors });
  const privacyViolations = ["sourceUrl", "internalAuthor", "reviewerNotes", "debugReasons", "sourceRow", "evidence"].filter(token => serialized.includes(token));
  return {
    version: "canonical-mix-scoring-audit-v1", processedMixes: mixes.length, sourceComponents, effectiveComponents, resolutionCounts,
    resolvedPercentageByCount: sourceComponents ? round(resolutionCounts.RESOLVED / sourceComponents * 100, 1) : 0, resolvedPercentageByWeight: totalWeight ? round(resolvedWeight / totalWeight * 100, 1) : 0,
    fullyResolvedMixes: full, partiallyResolvedMixes: partial, unresolvedMixes: none, duplicateCanonicalComponentGroups: duplicateGroups, mergedDuplicateComponents: mergedDuplicates,
    scoreDistribution: { min: scores.length ? Math.min(...scores) : 0, max: scores.length ? Math.max(...scores) : 0, average: scores.length ? round(scores.reduce((sum, value) => sum + value, 0) / scores.length, 1) : 0 },
    confidenceDistribution, verifiedSmokeScores: 0, purelyPredictedScores: scores.length, mixesWithAmbiguousComponents: [...ambiguous].sort(), mixesWithUnresolvedComponents: [...unresolved].sort(),
    scoringErrors: errors, sumPreservationErrors: sumErrors.sort(), componentPreservationErrors: componentErrors.sort(), privacyViolations,
  };
};
