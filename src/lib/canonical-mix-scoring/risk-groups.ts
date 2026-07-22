import type { AnalysisFactor, MixConflict, MixCompatibilityResult } from "../mix-compatibility";

export type CanonicalRiskSeverity = "LOW" | "MEDIUM" | "HIGH";
export type CanonicalRiskGroup = {
  readonly causeKey: string;
  readonly componentId: string | null;
  readonly severity: CanonicalRiskSeverity;
  readonly ruleIds: readonly string[];
  readonly factors: readonly (AnalysisFactor | MixConflict)[];
};

const severityRank: Readonly<Record<CanonicalRiskSeverity, number>> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
const warningSeverity = (impact: number): CanonicalRiskSeverity => Math.abs(impact) >= 0.75 ? "HIGH" : Math.abs(impact) >= 0.5 ? "MEDIUM" : "LOW";
const factorSeverity = (factor: AnalysisFactor | MixConflict): CanonicalRiskSeverity => "severity" in factor ? factor.severity : warningSeverity(factor.impact);
const componentFor = (factor: AnalysisFactor | MixConflict): string | null => "relatedComponents" in factor && factor.relatedComponents.length ? String(factor.relatedComponents[0]) : null;

export const riskCauseKey = (ruleId: string, componentId: string | null): string => {
  if (ruleId === "intensity.overdominant" || ruleId.startsWith("proportion.bright-large.")) return `DOMINANT_COMPONENT_HIGH_SHARE:${componentId ?? "unknown"}`;
  return `${ruleId}:${componentId ?? "mix"}`;
};

export const groupCompatibilityRisks = (compatibility: MixCompatibilityResult): readonly CanonicalRiskGroup[] => {
  const factors: Array<AnalysisFactor | MixConflict> = [...compatibility.conflicts, ...compatibility.warnings.filter(item => item.impact < 0)];
  const groups = new Map<string, Array<AnalysisFactor | MixConflict>>();
  for (const factor of factors) {
    const componentId = componentFor(factor);
    const key = riskCauseKey(factor.ruleId, componentId);
    groups.set(key, [...(groups.get(key) ?? []), factor]);
  }
  return [...groups.entries()].map(([causeKey, items]) => {
    const severity = items.map(factorSeverity).sort((a, b) => severityRank[b] - severityRank[a])[0];
    return { causeKey, componentId: componentFor(items[0]), severity, ruleIds: [...new Set(items.map(item => item.ruleId))].sort(), factors: [...items].sort((a, b) => a.ruleId.localeCompare(b.ruleId, "en")) };
  }).sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || a.causeKey.localeCompare(b.causeKey, "en"));
};

export const riskSeverityRank = (severity: CanonicalRiskSeverity): number => severityRank[severity];
