import type { CanonicalMixComponentInput } from "../canonical-mix-scoring";
import type { MixAnalysisResult } from "../mix-analysis";

export type GoldSetScenarioClass =
  | "RICH_COMPATIBLE"
  | "RICH_RISKY"
  | "SPARSE_COMPATIBLE"
  | "SPARSE_NO_RELATION"
  | "MIXED_COVERAGE"
  | "ALL_NULL"
  | "LOW_MEASURED"
  | "EXTREME_MEASURED"
  | "SMALL_PERCENTAGE"
  | "DOMINANT_COMPONENT"
  | "EQUAL_BRIGHT"
  | "KNOWN_CONFLICT"
  | "NO_KNOWN_CONFLICT"
  | "COUNTERFACTUAL";

export type GoldSetScenario = {
  readonly id: string;
  readonly title: string;
  readonly scenarioClass: GoldSetScenarioClass;
  readonly components: readonly CanonicalMixComponentInput[];
  readonly counterfactualGroup?: string;
};

export type ScoreDecomposition = {
  readonly blockValues: MixAnalysisResult["scoring"]["scoreBreakdown"];
  readonly baseWeights: Readonly<Record<string, number>>;
  readonly activeBlocks: readonly string[];
  readonly excludedBlocks: readonly string[];
  readonly activeWeightTotal: number;
  readonly effectiveWeights: Readonly<Record<string, number>>;
  readonly contributions: Readonly<Record<string, number>>;
  readonly scoreEvidenceCoverage: number;
  readonly knownRiskCount: number;
};

export type ScoringAuditRecord = {
  readonly id: string;
  readonly title: string;
  readonly scenarioClass: string;
  readonly predictedQualityScore: number;
  readonly compatibilityScore: number;
  readonly proportionsScore: number;
  readonly componentQualityScore: number | null;
  readonly balanceScore: number | null;
  readonly riskScore: number;
  readonly confirmationsScore: number;
  readonly identityCoverage: number;
  readonly profileCoverage: number;
  readonly dataQuality: number;
  readonly confidenceScore: number;
  readonly confidenceLabel: string;
  readonly decomposition: ScoreDecomposition;
  readonly warnings: readonly string[];
  readonly conflicts: readonly string[];
};

export type NumericDistribution = {
  readonly min: number | null;
  readonly max: number | null;
  readonly mean: number | null;
  readonly median: number | null;
  readonly p25: number | null;
  readonly p75: number | null;
  readonly standardDeviation: number | null;
};

export type SimulationSummary = {
  readonly option: "A" | "B" | "C" | "D";
  readonly description: string;
  readonly recipes: { readonly displayed: number; readonly suppressed: number; readonly scoreDistribution: NumericDistribution };
  readonly scenarios: { readonly displayed: number; readonly suppressed: number; readonly scoreDistribution: NumericDistribution };
  readonly jentCases: readonly { readonly id: string; readonly displayed: boolean; readonly label: string; readonly displayedScore: number | null }[];
};
