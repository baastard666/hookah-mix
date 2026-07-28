import { FLAVOR_PROFILE_FIELDS } from "../flavors/types";
import type { MixCompatibilityResult } from "../mix-compatibility";
import { CANONICAL_MIX_SCORING_VERSION, clamp, MIX_SCORE_WEIGHTS, round } from "./constants";
import { calculateMixConfidence } from "./calculate-mix-confidence";
import { groupCompatibilityRisks } from "./risk-groups";
import type { CanonicalMixScoringResult, MixScoreBreakdown, PreparedCanonicalMix } from "./types";

const weighted = (mix: PreparedCanonicalMix, selector: (index: number) => number): number => {
  const total = mix.components.reduce((sum, item) => sum + item.percentage, 0);
  return total > 0 ? mix.components.reduce((sum, item, index) => sum + selector(index) * item.percentage, 0) / total : 0;
};
// ADR-023: like `weighted`, but a component contributing no measured value (selector returns null) is
// excluded from both the numerator and the percentage denominator, not counted as a measured 0. If no
// component contributes anything at all, there is nothing to average - returns null.
const weightedPartial = (mix: PreparedCanonicalMix, selector: (index: number) => number | null): number | null => {
  const terms = mix.components.map((item, index) => ({ value: selector(index), percentage: item.percentage })).filter((item): item is { value: number; percentage: number } => item.value !== null);
  const total = terms.reduce((sum, item) => sum + item.percentage, 0);
  return total > 0 ? terms.reduce((sum, item) => sum + item.value * item.percentage, 0) / total : null;
};
// ADR-015/ADR-017/ADR-023: any of these fields may be null ("not measured"). Each is excluded from the
// average rather than treated as 0, at both levels: a field missing for one component is excluded from
// that component's own average (inner filter), and a component with no measured field at all is excluded
// from the mix-level weighted average (weightedPartial) instead of contributing a fabricated 0.
const componentQuality = (mix: PreparedCanonicalMix): number | null => weightedPartial(mix, index => {
  const profile = mix.components[index].profile;
  const terms = [
    profile.heatResistance,
    profile.juiciness,
    profile.intensity !== null ? 10 - Math.abs(profile.intensity - 7) : null,
    profile.naturalness,
    profile.persistence,
  ].filter((value): value is number => value !== null);
  return terms.length ? terms.reduce((sum, value) => sum + value, 0) / terms.length : null;
});
// ADR-023: true once at least one component has at least one measured (non-NEUTRAL_FALLBACK) profile
// field - decides whether `balance` (built from profileBalance/intensityBalance, both rule-based rather
// than a plain average, so they cannot report their own "no data" the way componentQuality does) has
// anything at all to go on, versus being computed for a mix nobody has any sensory data for.
const hasAnyProfileField = (mix: PreparedCanonicalMix): boolean =>
  mix.components.some(component => FLAVOR_PROFILE_FIELDS.some(field => component.profile[field] !== null));
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
  const quality = componentQuality(preparedMix);
  const scoreBreakdown: MixScoreBreakdown = {
    compatibility: compatibility.compatibilityScore,
    proportions: compatibility.proportionBalance.score,
    componentQuality: quality === null ? null : round(quality, 1),
    balance: hasAnyProfileField(preparedMix) ? round((compatibility.profileBalance.score + compatibility.intensityBalance.score) / 2, 1) : null,
    risks: round(riskScore(compatibility), 1),
    confirmations: round(confirmationScore(preparedMix), 1),
  };
  // ADR-023: "no data" (componentQuality/balance null) is excluded from predictedQualityScore entirely -
  // its weight is redistributed proportionally onto the remaining components, the same renormalization
  // ADR-022 already applied to calculateMixConfidence. confirmations is deliberately left untouched here
  // (out of scope for ADR-023) and can never be null itself, so it always keeps its fixed 0.1 weight.
  const activeWeights = Object.entries(MIX_SCORE_WEIGHTS).filter(([key]) => scoreBreakdown[key as keyof MixScoreBreakdown] !== null);
  const totalActiveWeight = activeWeights.reduce((sum, [, weight]) => sum + weight, 0);
  const predictedQualityScore = round(totalActiveWeight > 0 ? activeWeights.reduce((sum, [key, weight]) => sum + (scoreBreakdown[key as keyof MixScoreBreakdown] as number) * weight, 0) / totalActiveWeight : 0, 1);
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
