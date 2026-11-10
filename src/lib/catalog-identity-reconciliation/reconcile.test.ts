import { describe, expect, it } from "vitest";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../tobacco-identity-decisions";
import { createCatalogPersistenceReconciliationPlan } from "./reconcile";
import type { CatalogIdentityRecord } from "../catalog-identity";

const record = (overrides: Partial<CatalogIdentityRecord> = {}): CatalogIdentityRecord => ({
  catalogId: 1,
  brand: "Overdose",
  name: "Coffee",
  manufacturerId: null,
  productLineId: null,
  canonicalProductName: null,
  canonicalProductId: null,
  identityStatus: "UNRESOLVED",
  identityVerified: false,
  catalogEntryType: "REAL",
  ...overrides,
});

describe("catalog persistence reconciliation", () => {
  it("proposes one exact-safe update from the authoritative decision registry", () => {
    const plan = createCatalogPersistenceReconciliationPlan([record()]);
    expect(plan.summary).toMatchObject({ MISSING_PERSISTED_CANONICAL_ID: 1, SAFE_UPDATE: 1 });
    expect(plan.items[0]).toMatchObject({ safeToApply: true, expected: { canonicalProductId: "overdose-coffee", manufacturerId: "overdose", identityStatus: "RESOLVED", identityVerified: true } });
  });

  it("does not guess an unresolved product", () => {
    const plan = createCatalogPersistenceReconciliationPlan([record({ brand: "Unknown", name: "Mint" })]);
    expect(plan.items[0]).toMatchObject({ issueCode: "UNRESOLVED_SOURCE_IDENTITY", expected: null, safeToApply: false });
  });

  it("preserves manufacturer-only and ambiguous source states as typed blockers", () => {
    const plan = createCatalogPersistenceReconciliationPlan([record({ brand: "Unknown", name: "Coconut", identityStatus: "MANUFACTURER_ONLY" }), record({ catalogId: 2, brand: "Unknown", name: "Floral", identityStatus: "AMBIGUOUS" })]);
    expect(plan.items.map(item => item.issueCode)).toEqual(["MANUFACTURER_ONLY_SOURCE_IDENTITY", "AMBIGUOUS_SOURCE_IDENTITY"]);
  });

  it("blocks a canonical collision instead of updating either row", () => {
    const plan = createCatalogPersistenceReconciliationPlan([record(), record({ catalogId: 2, brand: "Other", name: "Other", canonicalProductId: "overdose-coffee" })]);
    expect(plan.items[0]).toMatchObject({ issueCode: "DUPLICATE_CANONICAL_BINDING", safeToApply: false });
  });

  it("is deterministic for the authoritative registry", () => {
    const input = [record(), record({ catalogId: 2, brand: "Unknown", name: "Mint" })];
    expect(createCatalogPersistenceReconciliationPlan(input, TOBACCO_IDENTITY_DECISION_REGISTRY)).toEqual(createCatalogPersistenceReconciliationPlan(input, TOBACCO_IDENTITY_DECISION_REGISTRY));
  });
});
