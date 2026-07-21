export type CatalogTobaccoIdentityInput = {
  readonly catalogId?: string | number | null;
  readonly brand?: string | null;
  readonly productLine?: string | null;
  readonly name?: string | null;
};

export type TobaccoIdentityResolutionStatus = "RESOLVED" | "MANUFACTURER_ONLY" | "PRODUCT_LINE_NOT_FOUND" | "MANUFACTURER_NOT_FOUND" | "AMBIGUOUS" | "INVALID_INPUT";
export type TobaccoIdentityMatchType = "EXPLICIT_FIELDS" | "EXACT_CANONICAL" | "EXACT_ALIAS" | "CONTROLLED_NAME_PREFIX" | "MANUFACTURER_FALLBACK";
export type TobaccoIdentityConfidence = "HIGH" | "MEDIUM" | "LOW";
export type TobaccoIdentityReasonCode = "EMPTY_BRAND_AND_NAME" | "UNKNOWN_MANUFACTURER" | "UNKNOWN_EXPLICIT_PRODUCT_LINE" | "PRODUCT_LINE_NOT_DETECTED" | "MULTIPLE_PRODUCT_LINE_MATCHES" | "EMPTY_PRODUCT_NAME";
export type TobaccoIdentityWarningCode = "EXPLICIT_PRODUCT_LINE_CONFLICTS_WITH_NAME_PREFIX";

export type NormalizedTobaccoIdentityInput = {
  readonly brand: string | null;
  readonly productLine: string | null;
  readonly name: string | null;
};

type ResolutionBase = {
  readonly status: TobaccoIdentityResolutionStatus;
  readonly catalogId?: string | number;
  readonly originalInput: CatalogTobaccoIdentityInput;
  readonly normalizedInput: NormalizedTobaccoIdentityInput;
  readonly reasonCodes: readonly TobaccoIdentityReasonCode[];
  readonly warnings: readonly TobaccoIdentityWarningCode[];
  readonly candidates: readonly string[];
};

export type ResolvedTobaccoIdentity = ResolutionBase & {
  readonly status: "RESOLVED";
  readonly manufacturerId: string;
  readonly manufacturer: string;
  readonly productLineId: string;
  readonly productLine: string;
  readonly productName: string;
  readonly displayName: string;
  readonly productId: string;
  readonly matchType: TobaccoIdentityMatchType;
  readonly confidence: TobaccoIdentityConfidence;
};

export type ManufacturerOnlyTobaccoIdentity = ResolutionBase & {
  readonly status: "MANUFACTURER_ONLY";
  readonly manufacturerId: string;
  readonly manufacturer: string;
  readonly productName: string | null;
  readonly matchType: "MANUFACTURER_FALLBACK";
  readonly confidence: TobaccoIdentityConfidence;
};

export type UnresolvedTobaccoIdentity = ResolutionBase & {
  readonly status: "PRODUCT_LINE_NOT_FOUND" | "MANUFACTURER_NOT_FOUND" | "AMBIGUOUS" | "INVALID_INPUT";
};

export type TobaccoIdentityResolution = ResolvedTobaccoIdentity | ManufacturerOnlyTobaccoIdentity | UnresolvedTobaccoIdentity;

export type CatalogTobaccoAuditEntry = CatalogTobaccoIdentityInput;
export type TobaccoCatalogAuditCounters = {
  readonly total: number;
  readonly resolved: number;
  readonly manufacturerOnly: number;
  readonly productLineNotFound: number;
  readonly manufacturerNotFound: number;
  readonly ambiguous: number;
  readonly invalidInput: number;
  readonly duplicateCandidates: number;
};
export type TobaccoCatalogDuplicateCandidate = { readonly productId: string; readonly catalogIds: readonly (string | number)[]; readonly displayName: string };
export type TobaccoCatalogAuditResult = {
  readonly counters: TobaccoCatalogAuditCounters;
  readonly resolutions: readonly TobaccoIdentityResolution[];
  readonly problems: readonly TobaccoIdentityResolution[];
  readonly duplicateCandidates: readonly TobaccoCatalogDuplicateCandidate[];
};
