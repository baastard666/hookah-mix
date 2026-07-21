import type { ExpertMixIdentityStatus } from "../expert-mix-knowledge";

export type TobaccoIdentityDecisionStatus = "RESOLVED" | "MANUFACTURER_ONLY" | "UNRESOLVED" | "AMBIGUOUS" | "REJECTED";
export type TobaccoIdentityReviewState = "UNREVIEWED" | "IN_REVIEW" | "CONFIRMED" | "NEEDS_MORE_EVIDENCE" | "AMBIGUOUS" | "REJECTED" | "DEFERRED";
export type ProductLineInterpretation = "CONFIRMED_NONE" | "CONFIRMED" | "EMBEDDED_IN_MANUFACTURER" | "EMBEDDED_IN_PRODUCT_NAME" | "UNKNOWN" | "AMBIGUOUS";
export type TobaccoIdentityEvidenceType = "OFFICIAL_MANUFACTURER_CATALOG" | "OFFICIAL_PRODUCT_PAGE" | "OFFICIAL_SOCIAL_ANNOUNCEMENT" | "VERIFIED_RETAIL_CATALOG" | "VERIFIED_REVIEW_DATABASE" | "INTERNAL_EXPERT_CONFIRMATION" | "USER_CONFIRMED_PRODUCT" | "OTHER_VERIFIED_SOURCE";
export type TobaccoIdentityConfidence = "LOW" | "MEDIUM" | "HIGH";
export type TobaccoIdentitySourcePriority = "P0" | "P1" | "P2" | "P3" | "USER_PRIORITY";

export type TobaccoIdentityEvidence = {
  readonly sourceType: TobaccoIdentityEvidenceType;
  readonly sourceReference: string;
  readonly sourceUrl?: string | null;
  readonly internalReference?: string | null;
  readonly confidence: TobaccoIdentityConfidence;
  readonly checkedAt: string;
  readonly notes?: string | null;
  readonly publicSafe: boolean;
};

export type TobaccoIdentityDecision = {
  readonly id: string;
  readonly sourceIdentity: {
    readonly manufacturer: string | null;
    readonly productLine: string | null;
    readonly productName: string | null;
    readonly normalizedManufacturer: string;
    readonly normalizedProductLine: string;
    readonly normalizedProductName: string;
    readonly sourceGroupId: string;
    readonly sourcePriority: TobaccoIdentitySourcePriority;
    readonly sourceSheets: readonly string[];
    readonly sourceRows: readonly number[];
    readonly productLineInterpretation: ProductLineInterpretation;
  };
  readonly decision: {
    readonly status: TobaccoIdentityDecisionStatus;
    readonly manufacturerId: string | null;
    readonly productLineId: string | null;
    readonly canonicalProductId: string | null;
    readonly canonicalManufacturerName: string | null;
    readonly canonicalProductLineName: string | null;
    readonly canonicalProductName: string | null;
    readonly aliases: readonly string[];
  };
  readonly evidence: readonly TobaccoIdentityEvidence[];
  readonly review: {
    readonly state: TobaccoIdentityReviewState;
    readonly reviewedByType: "INTERNAL_EXPERT" | "DATABASE_OWNER" | "USER" | "SYSTEM_IMPORT" | null;
    readonly reviewedAt: string | null;
    readonly reviewerNotes: string | null;
  };
  readonly metadata: {
    readonly version: "tobacco-identity-decision-v1";
    readonly createdAt: string | null;
    readonly updatedAt: string | null;
  };
};

export type TobaccoIdentityDecisionIssueCode =
  | "DECISION_INVALID" | "DECISION_NOT_CONFIRMED" | "DECISION_EVIDENCE_MISSING" | "DECISION_CONFIDENCE_MISSING" | "DECISION_CANONICAL_ID_MISSING" | "DECISION_CONFLICT" | "DECISION_DUPLICATE" | "DECISION_SOURCE_IDENTITY_INVALID"
  | "PRODUCT_LINE_UNCONFIRMED" | "PRODUCT_LINE_AMBIGUOUS" | "PRODUCT_LINE_FICTITIOUS" | "PRODUCT_LINE_REQUIRED_BY_LEGACY_MODEL"
  | "CANONICAL_ID_COLLISION" | "CANONICAL_ID_INVALID" | "CANONICAL_PRODUCT_CONFLICT" | "MANUFACTURER_CONFLICT"
  | "REVIEW_RECORD_INVALID" | "REVIEW_STATE_NOT_APPLICABLE" | "P2_P3_DECISION_NOT_ALLOWED"
  | "PUBLIC_PRIVATE_REFERENCE_EXPOSED" | "PUBLIC_REVIEWER_NOTE_EXPOSED";
export type TobaccoIdentityDecisionIssue = { readonly code: TobaccoIdentityDecisionIssueCode; readonly severity: "ERROR" | "WARNING"; readonly decisionId?: string; readonly groupId?: string; readonly message: string };
export type TobaccoIdentityDecisionValidation = { readonly valid: boolean; readonly applicable: boolean; readonly issues: readonly TobaccoIdentityDecisionIssue[] };

export type TobaccoIdentityLookup =
  | { readonly status: "FOUND"; readonly decision: Readonly<TobaccoIdentityDecision> }
  | { readonly status: "NOT_FOUND" }
  | { readonly status: "CONFLICT"; readonly issues: readonly TobaccoIdentityDecisionIssue[] };

export type TobaccoIdentityDecisionRegistry = {
  readonly version: "tobacco-identity-decision-registry-v1";
  readonly size: number;
  readonly list: () => readonly Readonly<TobaccoIdentityDecision>[];
  readonly getById: (id: string) => TobaccoIdentityLookup;
  readonly getBySourceGroupId: (sourceGroupId: string) => TobaccoIdentityLookup;
  readonly getBySourceIdentity: (manufacturer: string | null, productLine: string | null, productName: string | null) => TobaccoIdentityLookup;
  readonly getByCanonicalProductId: (canonicalProductId: string) => TobaccoIdentityLookup;
  readonly getByStatus: (status: TobaccoIdentityDecisionStatus) => readonly Readonly<TobaccoIdentityDecision>[];
};

export type TobaccoIdentityReviewRecord = {
  readonly groupId: string; readonly priority: TobaccoIdentitySourcePriority;
  readonly manufacturer: string | null; readonly productLine: string | null; readonly productName: string | null;
  readonly normalizedManufacturer: string; readonly normalizedProductLine: string; readonly normalizedProductName: string;
  readonly occurrenceCount: number; readonly componentOccurrenceCount: number; readonly verifiedMixCount: number;
  readonly currentStatus: ExpertMixIdentityStatus; readonly manufacturerKnown: boolean; readonly productLineKnown: boolean;
  readonly exactAliasCandidates: readonly string[]; readonly missingFields: readonly string[];
  readonly productLineInterpretation: ProductLineInterpretation; readonly proposedDecisionStatus: TobaccoIdentityDecisionStatus;
  readonly canonicalManufacturerId: string | null; readonly canonicalProductLineId: string | null; readonly canonicalProductId: string | null; readonly canonicalProductName: string | null;
  readonly aliases: readonly string[]; readonly evidenceType: TobaccoIdentityEvidenceType | null; readonly evidenceReference: string | null; readonly evidenceCheckedAt: string | null; readonly evidencePublicSafe: boolean; readonly confidence: TobaccoIdentityConfidence | null;
  readonly reviewerNotes: string | null; readonly reviewedAt: string | null; readonly decisionState: TobaccoIdentityReviewState;
};
export type TobaccoIdentityReviewPlan = {
  readonly version: "tobacco-identity-review-v1";
  readonly records: readonly TobaccoIdentityReviewRecord[];
  readonly userPriority: readonly TobaccoIdentityReviewRecord[];
  readonly counts: { readonly p0: number; readonly p1: number; readonly userPriority: number; readonly unreviewed: number; readonly confirmed: number };
};

export type IdentityCoverageCounts = { readonly resolved: number; readonly manufacturerOnly: number; readonly unresolved: number; readonly ambiguous: number; readonly invalid: number };
export type IdentityCoverageScopeComparison = { readonly before: IdentityCoverageCounts; readonly after: IdentityCoverageCounts };
export type TobaccoIdentityCoverageComparison = {
  readonly version: "tobacco-identity-coverage-v1";
  readonly before: IdentityCoverageCounts; readonly after: IdentityCoverageCounts;
  readonly componentsBefore: IdentityCoverageCounts; readonly componentsAfter: IdentityCoverageCounts;
  readonly catalogBefore: IdentityCoverageCounts; readonly catalogAfter: IdentityCoverageCounts;
  readonly verifiedComponents: IdentityCoverageScopeComparison; readonly userPriority: IdentityCoverageScopeComparison;
  readonly resolvedDelta: number; readonly manufacturerOnlyDelta: number; readonly unresolvedDelta: number;
  readonly appliedDecisionCount: number; readonly skippedDecisionCount: number; readonly conflictCount: number; readonly invalidDecisionCount: number;
  readonly issues: readonly TobaccoIdentityDecisionIssue[];
};

export type DecisionApplicableIdentityRecord = {
  readonly recordId: string; readonly scope: "COMPONENT" | "CATALOG" | "USER_PRIORITY";
  readonly sourcePriority: TobaccoIdentitySourcePriority; readonly usedInVerifiedMix: boolean;
  readonly manufacturer: string | null; readonly productLine: string | null; readonly productName: string | null;
  readonly identityStatus: ExpertMixIdentityStatus | "INVALID" | "REJECTED";
  readonly manufacturerId: string | null; readonly productLineId: string | null; readonly canonicalProductId: string | null; readonly canonicalProductName: string | null;
  readonly confidence: TobaccoIdentityConfidence | null; readonly evidenceTypes: readonly TobaccoIdentityEvidenceType[]; readonly confirmedDecision: boolean;
};
export type ApplyTobaccoIdentityDecisionsResult = { readonly records: readonly DecisionApplicableIdentityRecord[]; readonly appliedDecisionCount: number; readonly skippedDecisionCount: number; readonly conflictCount: number; readonly invalidDecisionCount: number; readonly issues: readonly TobaccoIdentityDecisionIssue[] };

export type CanonicalTobaccoProductFilters = { readonly manufacturerId?: string; readonly productLineId?: string | null; readonly canonicalProductId?: string; readonly identityStatus?: DecisionApplicableIdentityRecord["identityStatus"]; readonly confidence?: TobaccoIdentityConfidence; readonly evidenceType?: TobaccoIdentityEvidenceType; readonly sourcePriority?: TobaccoIdentitySourcePriority; readonly usedInVerifiedMix?: boolean; readonly unresolvedOnly?: boolean; readonly confirmedDecisionsOnly?: boolean };

export type PublicTobaccoIdentityDecision = { readonly status: TobaccoIdentityDecisionStatus; readonly manufacturerId: string | null; readonly productLineId: string | null; readonly canonicalProductId: string | null; readonly canonicalManufacturerName: string | null; readonly canonicalProductLineName: string | null; readonly canonicalProductName: string | null; readonly aliases: readonly string[]; readonly confidence: TobaccoIdentityConfidence | null; readonly evidenceTypes: readonly TobaccoIdentityEvidenceType[] };
