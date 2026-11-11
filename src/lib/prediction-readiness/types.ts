import type { PreparedCanonicalMix } from "../canonical-mix-scoring";
import type { FlavorProfileCoreField } from "../flavors/types";

export const PREDICTION_READINESS_STATES = ["INSUFFICIENT", "LIMITED", "READY"] as const;
export type PredictionReadinessStatus = typeof PREDICTION_READINESS_STATES[number];

export type PredictionReadinessInput = {
  readonly canonicalMix: PreparedCanonicalMix;
  readonly componentQuality: number | null;
  readonly balance: number | null;
  readonly verifiedSmokeAvailable: boolean;
};

export type ComponentSensoryEvidence = {
  readonly flavorId: string | number;
  readonly percentage: number;
  readonly measuredFields: readonly FlavorProfileCoreField[];
  readonly measuredFieldCount: number;
  readonly fieldCoverage: number;
};

export type PredictionReadiness = {
  readonly status: PredictionReadinessStatus;
  /** Weighted completeness of the seven registry sensory fields; identity is deliberately excluded. */
  readonly sensoryEvidenceCoverage: number;
  /** Alias kept for score-facing diagnostics; it has exactly the same sensory-only semantics. */
  readonly scoreEvidenceCoverage: number;
  readonly componentEvidence: readonly ComponentSensoryEvidence[];
  readonly missingCriticalScoreDimensions: readonly ("componentQuality" | "balance")[];
  readonly hasMeaningfulSensoryEvidence: boolean;
  readonly verifiedSmokeAvailable: boolean;
  readonly reasons: readonly string[];
};
