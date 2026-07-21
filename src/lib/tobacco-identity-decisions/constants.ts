import type { ProductLineInterpretation, TobaccoIdentityDecisionStatus, TobaccoIdentityEvidenceType, TobaccoIdentityReviewState } from "./types";

export const TOBACCO_IDENTITY_DECISION_VERSION = "tobacco-identity-decision-v1" as const;
export const TOBACCO_IDENTITY_DECISION_STATUSES: readonly TobaccoIdentityDecisionStatus[] = ["RESOLVED", "MANUFACTURER_ONLY", "UNRESOLVED", "AMBIGUOUS", "REJECTED"];
export const TOBACCO_IDENTITY_REVIEW_STATES: readonly TobaccoIdentityReviewState[] = ["UNREVIEWED", "IN_REVIEW", "CONFIRMED", "NEEDS_MORE_EVIDENCE", "AMBIGUOUS", "REJECTED", "DEFERRED"];
export const PRODUCT_LINE_INTERPRETATIONS: readonly ProductLineInterpretation[] = ["CONFIRMED_NONE", "CONFIRMED", "EMBEDDED_IN_MANUFACTURER", "EMBEDDED_IN_PRODUCT_NAME", "UNKNOWN", "AMBIGUOUS"];
export const TOBACCO_IDENTITY_EVIDENCE_TYPES: readonly TobaccoIdentityEvidenceType[] = ["OFFICIAL_MANUFACTURER_CATALOG", "OFFICIAL_PRODUCT_PAGE", "OFFICIAL_SOCIAL_ANNOUNCEMENT", "VERIFIED_RETAIL_CATALOG", "VERIFIED_REVIEW_DATABASE", "INTERNAL_EXPERT_CONFIRMATION", "USER_CONFIRMED_PRODUCT", "OTHER_VERIFIED_SOURCE"];
export const FICTITIOUS_PRODUCT_LINES = new Set(["default", "unknown", "main", "base"]);
