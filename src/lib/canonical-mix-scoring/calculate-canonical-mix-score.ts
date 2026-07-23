import type { MixCompatibilityResult } from "../mix-compatibility";
import { CANONICAL_MIX_SCORING_VERSION, clamp, MIX_SCORE_WEIGHTS, round } from "./constants";
import { calculateMixConfidence } from "./calculate-mix-confidence";
import { groupCompatibilityRisks } from "./risk-groups";
import type { CanonicalMixScoringResult, MixScoreBreakdown, PreparedCanonicalMix } from "./types";

const weighted = (mix: PreparedCanonicalMix, selector: (index: number) => number): number => {
  const total = mix.components.reduce((sum, item) => sum + item.percentage, 0);
  return total > 0 ? mix.components.reduce((sum, item, index) => sum + selector(index) * item.percentage, 0) / total : 0;
};
// ADR-015: naturalness/persistence are secondary fields and may be null ("not measured"). They are
// excluded from the average rather than treated as 0 - the divisor reflects only the terms actually present.
const componentQuality = (mix: PreparedCanonicalMix): number => weighted(mix, index => {
  const profile = mix.components[index].profile;
  const terms = [profile.heatResistance, profile.juiciness, 10 - Math.abs(profile.intensity - 7), profile.naturalness, profile.persistence]
    .filter((value): value is number => value !== null);
  return terms.length ? terms.reduce((sum, value) => sum + value, 0) / terms.length : 0;
});
const riskScore = (compatibility: MixCompatibilityResult): number => {
  const penalty = groupCompatibilityRisks(compatibility).reduce((sum, group) => sum + (group.severity === "HIGH" ? 1.5 : group.severity === "MEDIUM" ? 1 : 0.5), 0);
  return clamp(10 - penalty, 0, 10);
};
const confirmationScore = (mix: PreparedCanonicalMix): number => weighted(mix, index => {
  const component = mix.components[index];
  const proportionConfirmation = component.proportionConfirmed ? 2 : 0;
  const independentConfirmation = component.independentEvidenceCount >= 2 ? 1 : component.independentEvidenceCount === 1 ? 0.5 : 0;
  return 5 + proportionConfirmation + independentConfirmation;
});

export const calculateCanonicalMixScore = (input: { readonly preparedMix: PreparedCanonicalMix; readonly compatibility: MixCompatibilityResult; readonly verifiedSmokeScore?: number | null }): CanonicalMixScoringResult => {
  const { preparedMix, compatibility } = input;
  const scoreBreakdown: MixScoreBreakdown = {
    compatibility: compatibility.compatibilityScore,
    proportions: compatibility.proportionBalance.score,
    componentQuality: round(componentQuality(preparedMix), 1),
    balance: round((compatibility.profileBalance.score + compatibility.intensityBalance.score) / 2, 1),
    risks: round(riskScore(compatibility), 1),
    confirmations: round(confirmationScore(preparedMix), 1),
  };
  const predictedQualityScore = round(Object.entries(MIX_SCORE_WEIGHTS).reduce((sum, [key, weight]) => sum + scoreBreakdown[key as keyof MixScoreBreakdown] * weight, 0), 1);
  const verifiedSmokeScore = input.verifiedSmokeScore === undefined || input.verifiedSmokeScore === null ? null : round(clamp(input.verifiedSmokeScore, 0, 10), 1);
  const riskFlags = [...new Set([...compatibility.conflicts.map(item => item.ruleId), ...compatibility.warnings.filter(item => item.impact < 0).map(item => item.ruleId)])].sort();
  const confidence = calculateMixConfidence(preparedMix, { verifiedSmokeScore, knownRiskCount: groupCompatibilityRisks(compatibility).length });
  const unresolvedNotes = preparedMix.componentResolutions.filter(item => item.resolution.status !== "RESOLVED").sort((a, b) => b.percentage - a.percentage || a.sourceComponentId.localeCompare(b.sourceComponentId, "en")).map(item => `${item.normalizedIdentity.manufacturer || "не указан"} / ${item.normalizedIdentity.productName || "не указан"}: ${item.resolution.status}, ${round(item.percentage, 1)}%`);
  return {
    version: CANONICAL_MIX_SCORING_VERSION, predictedQualityScore, predictionConfidence: confidence, verifiedSmokeScore, isVerifiedSmokeScore: verifiedSmokeScore !== null,
    dataQuality: round((confidence.identityCoverage + confidence.profileCoverage) / 2, 1), scoreBreakdown, componentResolutions: preparedMix.componentResolutions,
    strengths: compatibility.positiveFactors.map(item => item.description), balanceNotes: compatibility.warnings.map(item => item.description), riskFlags, unresolvedNotes, duplicateWarnings: preparedMix.warnings,
  };
};
