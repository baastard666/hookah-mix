import type { FlavorNoteCategory } from "../flavor-knowledge";

// Target model fixed by ADR-014: 7 dimensions with a real evidence class (manufacturer
// pages, HTReviews, independent reviews). The other 11 Prisma Flavor sensory fields are
// intentionally excluded, not just unused - see ADR-014 before adding any of them back.
export type FlavorDimensionId = "sweetness" | "sourness" | "freshness" | "intensity" | "strength" | "heatResistance" | "juiciness";

export type EvidenceOrigin = "MANUFACTURER_CLAIM" | "REVIEW_AGGREGATE" | "EDITORIAL_ASSESSMENT";

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export type FlavorEvidence = {
  readonly type: EvidenceOrigin;
  readonly title: string;
  readonly reference?: string;
  readonly checkedAt: string;
};

export type FlavorDimensionValue = {
  readonly value: number;
  readonly confidence: ConfidenceLevel;
  readonly evidence: readonly FlavorEvidence[];
};

export type ProductFlavorProfile = {
  readonly canonicalProductId: string;
  readonly dimensions: Partial<Record<FlavorDimensionId, FlavorDimensionValue>>;
  readonly dominantNoteIds: readonly FlavorNoteCategory[];
  readonly overallConfidence: ConfidenceLevel;
};

export type ProductFlavorProfileRegistry = {
  readonly profiles: readonly ProductFlavorProfile[];
};

export type ProductFlavorProfileIssueCode =
  | "CANONICAL_PRODUCT_ID_NOT_FOUND"
  | "CANONICAL_PRODUCT_ID_NOT_RESOLVED"
  | "DUPLICATE_CANONICAL_PRODUCT_ID"
  | "DIMENSION_VALUE_OUT_OF_RANGE"
  | "DIMENSION_EVIDENCE_MISSING"
  | "OVERALL_CONFIDENCE_EXCEEDS_MINIMUM"
  | "DOMINANT_NOTE_ID_UNKNOWN";

export type ProductFlavorProfileIssue = {
  readonly code: ProductFlavorProfileIssueCode;
  readonly canonicalProductId: string;
  readonly message: string;
};

export type PublicFlavorEvidence = {
  readonly type: EvidenceOrigin;
  readonly title: string;
  readonly checkedAt: string;
};

export type PublicFlavorDimensionValue = {
  readonly value: number;
  readonly confidence: ConfidenceLevel;
  readonly evidence: readonly PublicFlavorEvidence[];
};

export type PublicProductFlavorProfile = {
  readonly canonicalProductId: string;
  readonly dimensions: Partial<Record<FlavorDimensionId, PublicFlavorDimensionValue>>;
  readonly dominantNoteIds: readonly FlavorNoteCategory[];
  readonly overallConfidence: ConfidenceLevel;
};
