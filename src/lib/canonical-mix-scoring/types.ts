import type { FlavorProfile, FlavorProfileField } from "../flavors/types";
import type { MixProfileNoteInput } from "../mix-profile";
import type { RecommendationComponentInput } from "../mix-recommendation";

export type MixComponentResolutionStatus = "RESOLVED" | "MANUFACTURER_ONLY" | "AMBIGUOUS" | "UNRESOLVED";
export type MixComponentMatchMethod = "EXACT_SOURCE_IDENTITY" | "EXACT_ALIAS" | "CANONICAL_ID" | "MANUFACTURER_ONLY" | "NONE";
export type MixComponentResolutionConfidence = "LOW" | "MEDIUM" | "HIGH";
export type EffectiveProfileReliability = "LOW" | "MEDIUM" | "HIGH";
export type CatalogStatus = "FOUND" | "NOT_FOUND";
export type PublicProfileStatus = "CONFIRMED" | "HIGH_RELIABILITY" | "MEDIUM_RELIABILITY" | "PRELIMINARY" | "FALLBACK" | "MISSING";
export type PredictionConfidenceLabel = "Предварительная" | "Средняя" | "Высокая" | "Подтверждённая";
export type EffectiveProfileSource =
  | "USER_SMOKE"
  | "INTERNAL_TEST"
  | "CANONICAL_PRODUCT_PROFILE"
  | "CANONICAL_TECHNICAL_PROFILE"
  | "EXTERNAL_AGGREGATE"
  | "PRELIMINARY_PROFILE"
  | "SOURCE_PROFILE"
  | "NEUTRAL_FALLBACK";

export type ConfirmedPercentageRange = { readonly min: number; readonly max: number };
export type EffectiveProfileCandidate = {
  readonly type: EffectiveProfileSource;
  readonly profileId?: string | null;
  readonly profile: Partial<FlavorProfile>;
  readonly notes?: readonly MixProfileNoteInput[];
  readonly reliabilityScore: number;
  readonly independentEvidenceCount?: number;
  readonly recommendedRole?: "BASE" | "SUPPORT" | "ACCENT" | "COOLING" | "ACIDIFIER" | "SWEETENER" | "TEXTURE" | "SPICE";
  readonly confirmedPercentageRange?: ConfirmedPercentageRange;
};

export type MixComponentIdentityInput = {
  readonly sourceComponentId?: string;
  readonly sourceRow?: { readonly sheet: string; readonly rowNumber: number };
  readonly mixId?: string;
  readonly rawManufacturer?: string | null;
  readonly rawProductLine?: string | null;
  readonly rawProductName?: string | null;
  readonly normalizedManufacturer?: string | null;
  readonly normalizedProductLine?: string | null;
  readonly normalizedProductName?: string | null;
  readonly canonicalProductId?: string | null;
  readonly sourceType?: string | null;
  readonly sourceStatus?: string | null;
};

export type CanonicalMixComponentInput = RecommendationComponentInput & {
  readonly catalogStatus?: CatalogStatus;
  readonly sourceProfileStatus?: string | null;
  readonly identity?: MixComponentIdentityInput;
  readonly profileCandidates?: readonly EffectiveProfileCandidate[];
  readonly sourceProfileAvailable?: boolean;
  readonly sourceProfileReliabilityScore?: number;
  readonly proportionConfirmed?: boolean;
  readonly independentEvidenceCount?: number;
};

export type MixComponentResolution = {
  readonly sourceComponentId: string;
  readonly percentage: number;
  readonly rawIdentity: { readonly manufacturer: string | null; readonly productLine: string | null; readonly productName: string | null };
  readonly normalizedIdentity: { readonly manufacturer: string; readonly productLine: string; readonly productName: string };
  readonly resolution: {
    readonly status: MixComponentResolutionStatus;
    readonly decisionId: string | null;
    readonly canonicalProductId: string | null;
    readonly canonicalManufacturer: string | null;
    readonly canonicalProductLine: string | null;
    readonly canonicalProductName: string | null;
    readonly matchedAlias: string | null;
    readonly matchMethod: MixComponentMatchMethod;
    readonly confidence: MixComponentResolutionConfidence;
  };
  readonly sourceRow: MixComponentIdentityInput["sourceRow"] | null;
  readonly debugReasons: readonly string[];
};

// ADR-023: value is null when no candidate (source/technical/canonical) had a real measurement for this
// field - NEUTRAL_FALLBACK no longer fabricates a number here, only marks reliabilityScore low.
export type EffectiveParameter = { readonly value: number | null; readonly source: EffectiveProfileSource; readonly reliabilityScore: number; readonly profileId: string | null };
export type EffectiveTobaccoProfile = {
  readonly profile: FlavorProfile;
  readonly notes: readonly MixProfileNoteInput[];
  readonly strengthLevel5: number | null;
  readonly parameters: Readonly<Record<FlavorProfileField, EffectiveParameter>>;
  readonly profileId: string | null;
  readonly profileSource: EffectiveProfileSource;
  readonly profileReliability: EffectiveProfileReliability;
  readonly profileReliabilityScore: number;
  readonly usedFallback: boolean;
  readonly recommendedRole: EffectiveProfileCandidate["recommendedRole"] | null;
  readonly confirmedPercentageRange: ConfirmedPercentageRange | null;
  readonly provenance: readonly { readonly source: EffectiveProfileSource; readonly profileId: string | null; readonly reliabilityScore: number }[];
};

export type PreparedCanonicalComponent = RecommendationComponentInput & {
  readonly catalogStatus: CatalogStatus;
  readonly profileStatus: PublicProfileStatus;
  readonly sourceComponentIds: readonly string[];
  readonly resolution: MixComponentResolution["resolution"];
  readonly effectiveProfile: EffectiveTobaccoProfile;
  readonly proportionConfirmed: boolean;
  readonly independentEvidenceCount: number;
};
export type CanonicalMixWarning = { readonly code: "DUPLICATE_CANONICAL_COMPONENT"; readonly canonicalProductId: string; readonly sourceComponentIds: readonly string[] };
export type PreparedCanonicalMix = {
  readonly components: readonly PreparedCanonicalComponent[];
  readonly componentResolutions: readonly MixComponentResolution[];
  readonly warnings: readonly CanonicalMixWarning[];
  readonly rawComponentCount: number;
  readonly effectiveComponentCount: number;
  readonly totalPercentage: number;
};

export type MixScoreBreakdown = {
  readonly compatibility: number;
  readonly proportions: number;
  // ADR-023: null when the mix has no real (non-NEUTRAL_FALLBACK) measurement for any field this
  // component reads - "no data" is excluded from predictedQualityScore's weighted average (weight
  // redistributed onto the other components) rather than silently scored as a neutral 0/10.
  readonly componentQuality: number | null;
  readonly balance: number | null;
  readonly risks: number;
  readonly confirmations: number;
};
export type MixPredictionConfidence = {
  readonly identityCoverage: number;
  readonly profileCoverage: number;
  readonly proportionCoverage: number;
  readonly externalEvidenceCoverage: number;
  readonly score: number;
  readonly finalConfidenceLabel: PredictionConfidenceLabel;
  readonly reasons: readonly string[];
};
export type CanonicalMixScoringResult = {
  readonly version: "canonical-mix-scoring-v1";
  readonly predictedQualityScore: number;
  readonly predictionConfidence: MixPredictionConfidence;
  readonly verifiedSmokeScore: number | null;
  readonly isVerifiedSmokeScore: boolean;
  readonly dataQuality: number;
  readonly scoreBreakdown: MixScoreBreakdown;
  readonly componentResolutions: readonly MixComponentResolution[];
  readonly strengths: readonly string[];
  readonly balanceNotes: readonly string[];
  readonly riskFlags: readonly string[];
  readonly unresolvedNotes: readonly string[];
  readonly duplicateWarnings: readonly CanonicalMixWarning[];
};

export type PublicCanonicalMixScoringResult = Omit<CanonicalMixScoringResult, "componentResolutions"> & {
  readonly componentResolutions: readonly {
    readonly percentage: number;
    readonly normalizedIdentity: MixComponentResolution["normalizedIdentity"];
    readonly resolution: Omit<MixComponentResolution["resolution"], "decisionId">;
  }[];
};
