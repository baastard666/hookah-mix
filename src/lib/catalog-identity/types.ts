import type { TobaccoIdentityReasonCode, TobaccoIdentityResolutionStatus, TobaccoIdentityWarningCode } from "../tobacco-product-identity";

export type CatalogIdentityStatus = "RESOLVED" | "MANUFACTURER_ONLY" | "UNRESOLVED" | "AMBIGUOUS" | "INVALID";
export type CatalogEntryType = "REAL" | "TEST" | "INTERNAL";

export type PersistedCatalogIdentity = {
  readonly manufacturerId: string | null;
  readonly productLineId: string | null;
  readonly canonicalProductName: string | null;
  readonly canonicalProductId: string | null;
  readonly identityStatus: CatalogIdentityStatus;
  readonly identityVerified: boolean;
  readonly catalogEntryType: CatalogEntryType;
};

export type CatalogIdentityRecord = PersistedCatalogIdentity & {
  readonly catalogId: string | number;
  readonly brand: string;
  readonly name: string;
};

export type CatalogIdentityProposal = {
  readonly identity: PersistedCatalogIdentity;
  readonly resolutionStatus: TobaccoIdentityResolutionStatus;
  readonly reasonCodes: readonly TobaccoIdentityReasonCode[];
  readonly warnings: readonly TobaccoIdentityWarningCode[];
};

export type CatalogIdentityValidationCode =
  | "CATALOG_ENTRY_NOT_FOUND"
  | "UNKNOWN_MANUFACTURER"
  | "UNKNOWN_PRODUCT_LINE"
  | "PRODUCT_LINE_DOES_NOT_BELONG_TO_MANUFACTURER"
  | "EMPTY_PRODUCT_NAME"
  | "DUPLICATE_CANONICAL_PRODUCT_ID";

export type CatalogIdentityValidationError = { readonly code: CatalogIdentityValidationCode; readonly message: string };

export type UpdateCatalogTobaccoIdentityInput = {
  readonly catalogId: string | number;
  readonly manufacturerId: string;
  readonly productLineId?: string | null;
  readonly canonicalProductName: string;
  readonly identityVerified?: boolean;
};

export type UpdateCatalogTobaccoIdentityResult =
  | { readonly success: true; readonly record: CatalogIdentityRecord }
  | { readonly success: false; readonly errors: readonly CatalogIdentityValidationError[] };

export type CatalogIdentityTransaction = {
  findById(catalogId: string | number): Promise<CatalogIdentityRecord | null>;
  findByCanonicalProductId(canonicalProductId: string): Promise<CatalogIdentityRecord | null>;
  updateIdentity(catalogId: string | number, identity: PersistedCatalogIdentity): Promise<CatalogIdentityRecord>;
};

export type CatalogIdentityStore = {
  list(): Promise<readonly CatalogIdentityRecord[]>;
  transaction<T>(operation: (transaction: CatalogIdentityTransaction) => Promise<T>): Promise<T>;
};

export type CatalogIdentityBackfillAction = "UPDATE" | "UNCHANGED" | "SKIPPED_VERIFIED" | "SKIPPED_TEST";
export type CatalogIdentityBackfillItem = {
  readonly catalogId: string | number;
  readonly brand: string;
  readonly name: string;
  readonly action: CatalogIdentityBackfillAction;
  readonly before: PersistedCatalogIdentity;
  readonly proposed: PersistedCatalogIdentity;
  readonly resolutionStatus: TobaccoIdentityResolutionStatus;
  readonly reasonCodes: readonly TobaccoIdentityReasonCode[];
  readonly warnings: readonly TobaccoIdentityWarningCode[];
};
export type CatalogIdentityBackfillOptions = {
  readonly apply?: boolean;
  readonly includeTest?: boolean;
  readonly onlyUnresolved?: boolean;
  readonly forceVerified?: boolean;
};
export type CatalogIdentityBackfillReport = {
  readonly mode: "DRY_RUN" | "APPLY";
  readonly counters: {
    readonly total: number;
    readonly updates: number;
    readonly unchanged: number;
    readonly skippedVerified: number;
    readonly skippedTest: number;
  };
  readonly items: readonly CatalogIdentityBackfillItem[];
};

export type CatalogIdentityCoverageResult = {
  readonly realCatalogEntries: number;
  readonly testCatalogEntries: number;
  readonly resolved: number;
  readonly manufacturerOnly: number;
  readonly unresolved: number;
  readonly verified: number;
  readonly unverified: number;
  readonly missingManufacturers: readonly string[];
  readonly missingProductLines: readonly string[];
};

export type CatalogIdentityConsistencyIssueCode =
  | "UNKNOWN_MANUFACTURER"
  | "UNKNOWN_PRODUCT_LINE"
  | "PRODUCT_LINE_DOES_NOT_BELONG_TO_MANUFACTURER"
  | "INVALID_CANONICAL_PRODUCT_ID"
  | "INCOMPLETE_RESOLVED_IDENTITY"
  | "INVALID_MANUFACTURER_ONLY_IDENTITY"
  | "UNRESOLVED_HAS_CANONICAL_PRODUCT_ID"
  | "INVALID_VERIFIED_IDENTITY"
  | "DUPLICATE_CANONICAL_PRODUCT_ID";
export type CatalogIdentityConsistencyIssue = { readonly catalogId: string | number; readonly code: CatalogIdentityConsistencyIssueCode; readonly message: string };
export type CatalogIdentityConsistencyResult = { readonly valid: boolean; readonly checked: number; readonly issues: readonly CatalogIdentityConsistencyIssue[] };
