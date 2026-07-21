import { resolveCatalogTobaccoIdentity } from "../tobacco-product-identity";
import { mapIdentityResolutionToPersistedIdentity } from "./mapper";
import type { CatalogIdentityBackfillItem, CatalogIdentityBackfillOptions, CatalogIdentityBackfillReport, CatalogIdentityRecord, CatalogIdentityStore, PersistedCatalogIdentity } from "./types";

const persisted = (record: CatalogIdentityRecord): PersistedCatalogIdentity => ({ manufacturerId: record.manufacturerId, productLineId: record.productLineId, canonicalProductName: record.canonicalProductName, canonicalProductId: record.canonicalProductId, identityStatus: record.identityStatus, identityVerified: record.identityVerified, catalogEntryType: record.catalogEntryType });
const sameIdentity = (left: PersistedCatalogIdentity, right: PersistedCatalogIdentity): boolean => JSON.stringify(left) === JSON.stringify(right);
const compareIds = (left: string | number, right: string | number): number => typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "en");

export const createCatalogIdentityBackfillPlan = (records: readonly CatalogIdentityRecord[], options: CatalogIdentityBackfillOptions = {}): readonly CatalogIdentityBackfillItem[] =>
  [...records].sort((left, right) => compareIds(left.catalogId, right.catalogId)).filter(record => !options.onlyUnresolved || record.identityStatus === "UNRESOLVED" || record.identityStatus === "AMBIGUOUS" || record.identityStatus === "INVALID").map(record => {
    const resolution = resolveCatalogTobaccoIdentity({ catalogId: record.catalogId, brand: record.brand, name: record.name });
    const proposal = mapIdentityResolutionToPersistedIdentity(resolution, { catalogEntryType: record.catalogEntryType, identityVerified: record.identityVerified });
    const before = persisted(record);
    const proposed = proposal.identity;
    const action = record.identityVerified && !options.forceVerified ? "SKIPPED_VERIFIED" : record.catalogEntryType === "TEST" && !options.includeTest ? "SKIPPED_TEST" : sameIdentity(before, proposed) ? "UNCHANGED" : "UPDATE";
    return { catalogId: record.catalogId, brand: record.brand, name: record.name, action, before, proposed, resolutionStatus: proposal.resolutionStatus, reasonCodes: proposal.reasonCodes, warnings: proposal.warnings };
  });

export const runCatalogIdentityBackfill = async (store: CatalogIdentityStore, options: CatalogIdentityBackfillOptions = {}): Promise<CatalogIdentityBackfillReport> => {
  const items = createCatalogIdentityBackfillPlan(await store.list(), options);
  if (options.apply) {
    await store.transaction(async transaction => {
      for (const item of items) if (item.action === "UPDATE") await transaction.updateIdentity(item.catalogId, item.proposed);
    });
  }
  const count = (action: CatalogIdentityBackfillItem["action"]): number => items.filter(item => item.action === action).length;
  return { mode: options.apply ? "APPLY" : "DRY_RUN", counters: { total: items.length, updates: count("UPDATE"), unchanged: count("UNCHANGED"), skippedVerified: count("SKIPPED_VERIFIED"), skippedTest: count("SKIPPED_TEST") }, items };
};
