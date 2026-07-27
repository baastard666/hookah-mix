import { clamp, round } from "./constants";
import type { MixPredictionConfidence, PredictionConfidenceLabel, PreparedCanonicalMix } from "./types";

const weighted = (values: readonly { readonly percentage: number; readonly value: number }[]): number => {
  const total = values.reduce((sum, item) => sum + item.percentage, 0);
  return total > 0 ? values.reduce((sum, item) => sum + item.value * item.percentage, 0) / total : 0;
};
const labelFor = (score: number, verifiedSmokeScore: number | null): PredictionConfidenceLabel => {
  if (verifiedSmokeScore !== null) return "Подтверждённая";
  if (score >= 75) return "Высокая";
  if (score >= 45) return "Средняя";
  return "Предварительная";
};

export const calculateMixConfidence = (mix: PreparedCanonicalMix, options: { readonly verifiedSmokeScore?: number | null; readonly knownRiskCount?: number } = {}): MixPredictionConfidence => {
  const identityCoverage = weighted(mix.componentResolutions.map(item => ({ percentage: item.percentage, value: item.resolution.status === "RESOLVED" ? 100 : 0 })));
  const profileCoverage = weighted(mix.components.map(item => ({ percentage: item.percentage, value: item.effectiveProfile.profileReliabilityScore })));
  const proportionCoverage = weighted(mix.components.map(item => ({ percentage: item.percentage, value: item.proportionConfirmed ? 100 : 70 })));
  const externalEvidenceCoverage = weighted(mix.components.map(item => ({ percentage: item.percentage, value: clamp(item.independentEvidenceCount / 2 * 100) })));
  const riskPenalty = Math.min(10, Math.max(0, options.knownRiskCount ?? 0) * 2);
  // ADR-022: proportionCoverage/externalEvidenceCoverage are excluded from the weighted score below.
  // Root cause (see ADR-021): fromPrismaFlavor never sets proportionConfirmed/independentEvidenceCount for any
  // live product, so both axes are a flat, uninformative constant (70 / 0) for every mix in the system today -
  // weighting them in was equivalent to docking every score by a fixed amount regardless of actual mix quality,
  // the same "unmeasured != 0" mistake ADR-015/017 already fixed for FlavorProfile fields. Their weight is
  // redistributed onto identityCoverage/profileCoverage, which do vary meaningfully today. Both fields are still
  // computed and reported below (UI transparency, and so this reverts cleanly once VerifiedMixRecipeRegistry
  // (ADR-021) gives them real signal - this redistribution is a stopgap, not a permanent scoring decision.
  const score = clamp(identityCoverage * 0.55 + profileCoverage * 0.45 - riskPenalty);
  const reasons: string[] = [];
  if (identityCoverage === 100) reasons.push("Все основные компоненты сопоставлены с canonical catalog.");
  else {
    const unresolved = mix.componentResolutions.filter(item => item.resolution.status !== "RESOLVED").sort((a, b) => b.percentage - a.percentage || a.sourceComponentId.localeCompare(b.sourceComponentId, "en"));
    for (const item of unresolved) reasons.push(`Компонент с долей ${round(item.percentage, 1)}% имеет статус ${item.resolution.status}; уверенность прогноза снижена.`);
  }
  if (profileCoverage < 50) reasons.push("Для значимой части смеси доступны только предварительные или fallback-профили.");
  if (mix.warnings.length) reasons.push("Дублирующиеся raw-названия объединены по canonical product без двойного влияния на score.");
  if (options.verifiedSmokeScore === null || options.verifiedSmokeScore === undefined) reasons.push("Реальный покур отсутствует: оценка является прогнозной.");
  else reasons.push("Реальный покур сохранён отдельно от прогнозной оценки.");
  if (riskPenalty > 0) reasons.push("Известные риски снижают уверенность, но не подменяют прогноз качества.");
  return {
    identityCoverage: round(identityCoverage, 1), profileCoverage: round(profileCoverage, 1), proportionCoverage: round(proportionCoverage, 1), externalEvidenceCoverage: round(externalEvidenceCoverage, 1),
    score: round(score, 1), finalConfidenceLabel: labelFor(score, options.verifiedSmokeScore ?? null), reasons,
  };
};
