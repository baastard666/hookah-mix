import type { CatalogIdentityRecord, PersistedCatalogIdentity } from "../catalog-identity";

export type CatalogReconciliationIssueCode =
  | "MISSING_PERSISTED_CANONICAL_ID"
  | "STALE_CANONICAL_ID"
  | "LEGACY_CANONICAL_ID"
  | "INCORRECT_CANONICAL_ID"
  | "DUPLICATE_CANONICAL_BINDING"
  | "UNRESOLVED_SOURCE_IDENTITY"
  | "AMBIGUOUS_SOURCE_IDENTITY"
  | "MANUFACTURER_ONLY_SOURCE_IDENTITY"
  | "UNKNOWN";

export type CatalogReconciliationItem = {
  readonly catalogId: string | number;
  readonly brand: string;
  readonly name: string;
  readonly before: PersistedCatalogIdentity;
  readonly expected: PersistedCatalogIdentity | null;
  readonly issueCode: CatalogReconciliationIssueCode | null;
  readonly reason: string;
  readonly safeToApply: boolean;
};

export type CatalogReconciliationPlan = {
  readonly version: "catalog-persistence-reconciliation-v1";
  readonly items: readonly CatalogReconciliationItem[];
  readonly summary: Readonly<Record<CatalogReconciliationIssueCode | "UNCHANGED" | "SAFE_UPDATE", number>>;
};

export type CatalogReconciliationStore = {
  list(): Promise<readonly CatalogIdentityRecord[]>;
  transaction<T>(operation: (transaction: { updateIdentity(catalogId: string | number, identity: PersistedCatalogIdentity): Promise<CatalogIdentityRecord> }) => Promise<T>): Promise<T>;
};

export type CatalogReconciliationReport = {
  readonly mode: "DRY_RUN" | "APPLY";
  readonly plan: CatalogReconciliationPlan;
  readonly appliedCatalogIds: readonly (string | number)[];
};
