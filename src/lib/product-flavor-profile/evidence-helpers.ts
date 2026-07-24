import type { ConfidenceLevel, EvidenceOrigin, FlavorDimensionValue, FlavorEvidence } from "./types";

export const CHECKED_AT = "2026-07-23";

export const evidence = (type: EvidenceOrigin, title: string, reference?: string): FlavorEvidence => ({ type, title, ...(reference ? { reference } : {}), checkedAt: CHECKED_AT });
export const manufacturer = (title: string, reference: string): FlavorEvidence => evidence("MANUFACTURER_CLAIM", title, reference);
export const reviewAggregate = (title: string, reference: string): FlavorEvidence => evidence("REVIEW_AGGREGATE", title, reference);
export const editorial = (title: string): FlavorEvidence => evidence("EDITORIAL_ASSESSMENT", title);
export const dim = (value: number, confidence: ConfidenceLevel, dimEvidence: readonly FlavorEvidence[]): FlavorDimensionValue => ({ value, confidence, evidence: dimEvidence });
