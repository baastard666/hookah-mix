import { LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY, normalizeDecisionText, TOBACCO_IDENTITY_DECISION_REGISTRY, validateTobaccoIdentityDecision } from "../tobacco-identity-decisions";
import type { TobaccoIdentityDecision, TobaccoIdentityDecisionRegistry } from "../tobacco-identity-decisions";
import type { CatalogIdentityRecord, PersistedCatalogIdentity } from "../catalog-identity";
import type { CatalogReconciliationIssueCode, CatalogReconciliationItem, CatalogReconciliationPlan, CatalogReconciliationReport, CatalogReconciliationStore } from "./types";

const same = (left: PersistedCatalogIdentity, right: PersistedCatalogIdentity): boolean => JSON.stringify(left) === JSON.stringify(right);
const sourceNameMatches = (decision: TobaccoIdentityDecision, name: string): boolean => {
  const normalized = normalizeDecisionText(name);
  return [decision.sourceIdentity.productName, decision.decision.canonicalProductName, ...decision.decision.aliases].some(candidate => normalizeDecisionText(candidate) === normalized);
};
const brandMatches = (decision: TobaccoIdentityDecision, brand: string): boolean => {
  const normalized = normalizeDecisionText(brand);
  return [decision.sourceIdentity.manufacturer, decision.decision.canonicalManufacturerName].some(candidate => normalizeDecisionText(candidate) === normalized);
};
const resolved = (decision: TobaccoIdentityDecision): boolean => decision.decision.status === "RESOLVED" && validateTobaccoIdentityDecision(decision).applicable && Boolean(decision.decision.manufacturerId && decision.decision.canonicalProductId && decision.decision.canonicalProductName);
const expected = (record: CatalogIdentityRecord, decision: TobaccoIdentityDecision): PersistedCatalogIdentity => ({
  manufacturerId: decision.decision.manufacturerId,
  productLineId: decision.decision.productLineId,
  canonicalProductName: decision.decision.canonicalProductName,
  canonicalProductId: decision.decision.canonicalProductId,
  identityStatus: "RESOLVED",
  identityVerified: true,
  catalogEntryType: record.catalogEntryType,
});
const issue = (record: CatalogIdentityRecord, target: PersistedCatalogIdentity, conflict: boolean): CatalogReconciliationItem => {
  const current = record.canonicalProductId;
  const legacy = current ? LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY.resolve(current) : { status: "NOT_FOUND" as const };
  const issueCode: CatalogReconciliationIssueCode = conflict ? "DUPLICATE_CANONICAL_BINDING" : !current ? "MISSING_PERSISTED_CANONICAL_ID" : legacy.status === "FOUND" ? "LEGACY_CANONICAL_ID" : current === target.canonicalProductId ? "STALE_CANONICAL_ID" : "INCORRECT_CANONICAL_ID";
  return { catalogId: record.catalogId, brand: record.brand, name: record.name, before: toIdentity(record), expected: target, issueCode, reason: conflict ? "Expected canonicalProductId is already bound to another Prisma Flavor." : "Exact confirmed identity decision is authoritative for this catalog row.", safeToApply: !conflict };
};
const toIdentity = (record: CatalogIdentityRecord): PersistedCatalogIdentity => ({ manufacturerId: record.manufacturerId, productLineId: record.productLineId, canonicalProductName: record.canonicalProductName, canonicalProductId: record.canonicalProductId, identityStatus: record.identityStatus, identityVerified: record.identityVerified, catalogEntryType: record.catalogEntryType });
const exactResolvedDecision = (record: CatalogIdentityRecord, registry: TobaccoIdentityDecisionRegistry): readonly TobaccoIdentityDecision[] => {
  const direct = record.canonicalProductId ? registry.getByCanonicalProductId(record.canonicalProductId) : { status: "NOT_FOUND" as const };
  const candidates = direct.status === "FOUND" && resolved(direct.decision) ? [direct.decision] : registry.list().filter(decision => resolved(decision) && brandMatches(decision, record.brand) && sourceNameMatches(decision, record.name));
  return [...new Map(candidates.map(decision => [decision.decision.canonicalProductId!, decision])).values()];
};

export const createCatalogPersistenceReconciliationPlan = (records: readonly CatalogIdentityRecord[], registry: TobaccoIdentityDecisionRegistry = TOBACCO_IDENTITY_DECISION_REGISTRY): CatalogReconciliationPlan => {
  const used = new Map(records.filter(record => record.canonicalProductId).map(record => [record.canonicalProductId!, record.catalogId]));
  const items: readonly CatalogReconciliationItem[] = [...records].sort((left, right) => Number(left.catalogId) - Number(right.catalogId)).map((record): CatalogReconciliationItem => {
    const candidates = exactResolvedDecision(record, registry);
    if (candidates.length === 1) {
      const target = expected(record, candidates[0]!);
      if (same(toIdentity(record), target)) return { catalogId: record.catalogId, brand: record.brand, name: record.name, before: toIdentity(record), expected: target, issueCode: null, reason: "Persisted identity matches the exact confirmed decision.", safeToApply: false };
      const owner = used.get(target.canonicalProductId!);
      return issue(record, target, owner !== undefined && owner !== record.catalogId);
    }
    if (candidates.length > 1) return { catalogId: record.catalogId, brand: record.brand, name: record.name, before: toIdentity(record), expected: null, issueCode: "AMBIGUOUS_SOURCE_IDENTITY", reason: "Several exact confirmed canonical decisions match this source identity.", safeToApply: false };
    const registryStatus = registry.getBySourceIdentity(record.brand, null, record.name);
    if (registryStatus.status === "FOUND") {
      const status = registryStatus.decision.decision.status;
      const issueCode: CatalogReconciliationIssueCode = status === "AMBIGUOUS" ? "AMBIGUOUS_SOURCE_IDENTITY" : status === "MANUFACTURER_ONLY" ? "MANUFACTURER_ONLY_SOURCE_IDENTITY" : status === "UNRESOLVED" || status === "REJECTED" ? "UNRESOLVED_SOURCE_IDENTITY" : "UNKNOWN";
      return { catalogId: record.catalogId, brand: record.brand, name: record.name, before: toIdentity(record), expected: null, issueCode, reason: `Authoritative decision status is ${status}; automatic persistence is intentionally forbidden.`, safeToApply: false };
    }
    if (record.identityStatus === "AMBIGUOUS") return { catalogId: record.catalogId, brand: record.brand, name: record.name, before: toIdentity(record), expected: null, issueCode: "AMBIGUOUS_SOURCE_IDENTITY", reason: "The persisted source identity is ambiguous and has no exact confirmed authoritative decision.", safeToApply: false };
    if (record.identityStatus === "MANUFACTURER_ONLY") return { catalogId: record.catalogId, brand: record.brand, name: record.name, before: toIdentity(record), expected: null, issueCode: "MANUFACTURER_ONLY_SOURCE_IDENTITY", reason: "Only the manufacturer is persisted; no exact confirmed authoritative product decision exists.", safeToApply: false };
    if (record.identityStatus === "UNRESOLVED") return { catalogId: record.catalogId, brand: record.brand, name: record.name, before: toIdentity(record), expected: null, issueCode: "UNRESOLVED_SOURCE_IDENTITY", reason: "The persisted source identity is unresolved and has no exact confirmed authoritative decision.", safeToApply: false };
    return { catalogId: record.catalogId, brand: record.brand, name: record.name, before: toIdentity(record), expected: null, issueCode: "UNKNOWN", reason: "No exact confirmed authoritative decision matches this Prisma Flavor.", safeToApply: false };
  });
  const summaryKeys: readonly (CatalogReconciliationIssueCode | "UNCHANGED" | "SAFE_UPDATE")[] = ["MISSING_PERSISTED_CANONICAL_ID", "STALE_CANONICAL_ID", "LEGACY_CANONICAL_ID", "INCORRECT_CANONICAL_ID", "DUPLICATE_CANONICAL_BINDING", "UNRESOLVED_SOURCE_IDENTITY", "AMBIGUOUS_SOURCE_IDENTITY", "MANUFACTURER_ONLY_SOURCE_IDENTITY", "UNKNOWN", "UNCHANGED", "SAFE_UPDATE"];
  const summary = Object.fromEntries(summaryKeys.map(code => [code, 0])) as Record<CatalogReconciliationIssueCode | "UNCHANGED" | "SAFE_UPDATE", number>;
  for (const item of items) summary[item.issueCode ?? "UNCHANGED"] += 1;
  summary.SAFE_UPDATE = items.filter(item => item.safeToApply).length;
  return { version: "catalog-persistence-reconciliation-v1", items, summary };
};

export const runCatalogPersistenceReconciliation = async (store: CatalogReconciliationStore, options: { readonly apply?: boolean } = {}): Promise<CatalogReconciliationReport> => {
  const plan = createCatalogPersistenceReconciliationPlan(await store.list());
  const appliedCatalogIds = plan.items.filter(item => item.safeToApply).map(item => item.catalogId);
  if (options.apply) await store.transaction(async transaction => { for (const item of plan.items) if (item.safeToApply && item.expected) await transaction.updateIdentity(item.catalogId, item.expected); });
  return { mode: options.apply ? "APPLY" : "DRY_RUN", plan, appliedCatalogIds };
};
