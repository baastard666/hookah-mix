import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveCatalogTobaccoIdentity } from "../tobacco-product-identity";
import { calculateCatalogIdentityCoverage, createCatalogIdentityBackfillPlan, createManufacturerOnlyCanonicalProductId, createResolvedCanonicalProductId, mapIdentityResolutionToPersistedIdentity, runCatalogIdentityBackfill, updateCatalogTobaccoIdentity, verifyPersistedCatalogIdentities } from "./index";
import type { CatalogIdentityRecord, CatalogIdentityStore, CatalogIdentityTransaction, PersistedCatalogIdentity } from "./types";

const emptyIdentity: PersistedCatalogIdentity = { manufacturerId: null, productLineId: null, canonicalProductName: null, canonicalProductId: null, identityStatus: "UNRESOLVED", identityVerified: false, catalogEntryType: "REAL" };
const record = (values: Partial<CatalogIdentityRecord> = {}): CatalogIdentityRecord => ({ catalogId: 1, brand: "Darkside", name: "Кокос", ...emptyIdentity, ...values });

const memoryStore = (initial: readonly CatalogIdentityRecord[], failUpdateId?: string | number): CatalogIdentityStore & { snapshot(): readonly CatalogIdentityRecord[] } => {
  let state: CatalogIdentityRecord[] = initial.map(item => structuredClone(item));
  const transaction = (working: CatalogIdentityRecord[]): CatalogIdentityTransaction => ({
    findById: async id => working.find(item => item.catalogId === id) ?? null,
    findByCanonicalProductId: async id => working.find(item => item.canonicalProductId === id) ?? null,
    updateIdentity: async (id, identity) => {
      if (id === failUpdateId) throw new Error("simulated update failure");
      const index = working.findIndex(item => item.catalogId === id);
      if (index < 0) throw new Error("missing record");
      working[index] = { ...working[index], ...identity };
      return structuredClone(working[index]);
    },
  });
  return {
    list: async () => structuredClone(state),
    transaction: async operation => { const working = state.map(item => structuredClone(item)); const result = await operation(transaction(working)); state = working; return result; },
    snapshot: () => structuredClone(state),
  };
};

describe("canonical catalog identity mapper", () => {
  it("maps RESOLVED", () => { expect(mapIdentityResolutionToPersistedIdentity(resolveCatalogTobaccoIdentity({ brand: "Darkside", productLine: "Core", name: "Lemon" })).identity).toEqual({ manufacturerId: "darkside", productLineId: "darkside-core", canonicalProductName: "Lemon", canonicalProductId: "darkside-core-lemon", identityStatus: "RESOLVED", identityVerified: false, catalogEntryType: "REAL" }); });
  it("maps MANUFACTURER_ONLY to a line-less ID", () => { expect(mapIdentityResolutionToPersistedIdentity(resolveCatalogTobaccoIdentity({ brand: "Darkside", name: "Кокос" })).identity).toMatchObject({ manufacturerId: "darkside", productLineId: null, canonicalProductId: "darkside-manufacturer-only-кокос", identityStatus: "MANUFACTURER_ONLY" }); });
  it("maps unknown manufacturer", () => { expect(mapIdentityResolutionToPersistedIdentity(resolveCatalogTobaccoIdentity({ brand: "Unknown", name: "Mint" })).identity).toMatchObject({ identityStatus: "UNRESOLVED", manufacturerId: null, canonicalProductId: null }); });
  it("maps ambiguous without selecting a candidate", () => { const resolution = { ...resolveCatalogTobaccoIdentity({}), status: "AMBIGUOUS" as const, reasonCodes: ["MULTIPLE_PRODUCT_LINE_MATCHES" as const], candidates: ["A", "B"] }; expect(mapIdentityResolutionToPersistedIdentity(resolution).identity).toMatchObject({ identityStatus: "AMBIGUOUS", canonicalProductId: null }); });
  it("maps invalid", () => { expect(mapIdentityResolutionToPersistedIdentity(resolveCatalogTobaccoIdentity({})).identity.identityStatus).toBe("INVALID"); });
  it("preserves warnings in report", () => { expect(mapIdentityResolutionToPersistedIdentity(resolveCatalogTobaccoIdentity({ brand: "Darkside", productLine: "Core", name: "Rare Pear" })).warnings).toEqual(["EXPLICIT_PRODUCT_LINE_CONFLICTS_WITH_NAME_PREFIX"]); });
  it("defaults verification to false", () => { expect(mapIdentityResolutionToPersistedIdentity(resolveCatalogTobaccoIdentity({ brand: "Darkside", name: "Кокос" })).identity.identityVerified).toBe(false); });
});

describe("canonical product IDs", () => {
  it("is stable", () => { expect(createResolvedCanonicalProductId("darkside-core", "Lemon")).toBe(createResolvedCanonicalProductId("darkside-core", "Lemon")); });
  it("supports Unicode", () => { expect(createResolvedCanonicalProductId("darkside-core", "Кокос 🥥")).toBe("darkside-core-кокос"); });
  it("supports Cyrillic", () => { expect(createManufacturerOnlyCanonicalProductId("blackburn", "Ваниль")).toBe("blackburn-manufacturer-only-ваниль"); });
  it("normalizes case", () => { expect(createManufacturerOnlyCanonicalProductId("DARKSIDE", "КОКОС")).toBe("darkside-manufacturer-only-кокос"); });
  it("normalizes extra spaces", () => { expect(createResolvedCanonicalProductId(" darkside-core ", " Lemon   Mint ")).toBe("darkside-core-lemon-mint"); });
  it("keeps line-less and resolved IDs distinct", () => { expect(createManufacturerOnlyCanonicalProductId("darkside", "Coconut")).not.toBe(createResolvedCanonicalProductId("darkside-core", "Coconut")); });
  it("returns the same ID for equivalent input", () => { expect(createManufacturerOnlyCanonicalProductId(" DarkSide ", "  Кокос ")).toBe(createManufacturerOnlyCanonicalProductId("darkside", "Кокос")); });
});

describe("explicit identity update service", () => {
  it("accepts a valid manufacturer", async () => { const result = await updateCatalogTobaccoIdentity({ catalogId: 1, manufacturerId: "darkside", canonicalProductName: "Кокос" }, memoryStore([record()])); expect(result).toMatchObject({ success: true, record: { identityStatus: "MANUFACTURER_ONLY" } }); });
  it("accepts a valid line", async () => { const result = await updateCatalogTobaccoIdentity({ catalogId: 1, manufacturerId: "darkside", productLineId: "darkside-core", canonicalProductName: "Lemon" }, memoryStore([record()])); expect(result).toMatchObject({ success: true, record: { canonicalProductId: "darkside-core-lemon", identityStatus: "RESOLVED" } }); });
  it("rejects unknown manufacturer", async () => { expect(await updateCatalogTobaccoIdentity({ catalogId: 1, manufacturerId: "unknown", canonicalProductName: "Mint" }, memoryStore([record()]))).toMatchObject({ success: false, errors: [{ code: "UNKNOWN_MANUFACTURER" }] }); });
  it("rejects unknown line", async () => { expect(await updateCatalogTobaccoIdentity({ catalogId: 1, manufacturerId: "darkside", productLineId: "missing", canonicalProductName: "Mint" }, memoryStore([record()]))).toMatchObject({ success: false, errors: [{ code: "UNKNOWN_PRODUCT_LINE" }] }); });
  it("rejects a line owned by another manufacturer", async () => { expect(await updateCatalogTobaccoIdentity({ catalogId: 1, manufacturerId: "darkside", productLineId: "hooligan-medium", canonicalProductName: "Mint" }, memoryStore([record()]))).toMatchObject({ success: false, errors: [{ code: "PRODUCT_LINE_DOES_NOT_BELONG_TO_MANUFACTURER" }] }); });
  it("rejects an empty product name", async () => { expect(await updateCatalogTobaccoIdentity({ catalogId: 1, manufacturerId: "darkside", canonicalProductName: "  " }, memoryStore([record()]))).toMatchObject({ success: false, errors: [{ code: "EMPTY_PRODUCT_NAME" }] }); });
  it("rejects duplicate canonicalProductId", async () => { const duplicate = record({ catalogId: 2, canonicalProductId: "darkside-manufacturer-only-кокос" }); expect(await updateCatalogTobaccoIdentity({ catalogId: 1, manufacturerId: "darkside", canonicalProductName: "Кокос" }, memoryStore([record(), duplicate]))).toMatchObject({ success: false, errors: [{ code: "DUPLICATE_CANONICAL_PRODUCT_ID" }] }); });
  it("sets verification only explicitly", async () => { const result = await updateCatalogTobaccoIdentity({ catalogId: 1, manufacturerId: "darkside", canonicalProductName: "Кокос", identityVerified: true }, memoryStore([record()])); expect(result).toMatchObject({ success: true, record: { identityVerified: true } }); });
  it("does not clear existing verification implicitly", async () => { const result = await updateCatalogTobaccoIdentity({ catalogId: 1, manufacturerId: "darkside", canonicalProductName: "Кокос" }, memoryStore([record({ identityVerified: true })])); expect(result).toMatchObject({ success: true, record: { identityVerified: true } }); });
  it("rolls back a failed transaction", async () => { const store = memoryStore([record()], 1); await expect(updateCatalogTobaccoIdentity({ catalogId: 1, manufacturerId: "darkside", canonicalProductName: "Кокос" }, store)).rejects.toThrow("simulated update failure"); expect(store.snapshot()).toEqual([record()]); });
});

describe("catalog identity backfill", () => {
  it("does not write in dry-run", async () => { const store = memoryStore([record()]); await runCatalogIdentityBackfill(store); expect(store.snapshot()).toEqual([record()]); });
  it("writes in apply mode", async () => { const store = memoryStore([record()]); await runCatalogIdentityBackfill(store, { apply: true }); expect(store.snapshot()[0]).toMatchObject({ identityStatus: "MANUFACTURER_ONLY", canonicalProductId: "darkside-manufacturer-only-кокос" }); });
  it("skips verified records", () => { expect(createCatalogIdentityBackfillPlan([record({ identityVerified: true })])[0].action).toBe("SKIPPED_VERIFIED"); });
  it("preserves verification during explicit forced planning", () => { expect(createCatalogIdentityBackfillPlan([record({ identityVerified: true })], { forceVerified: true })[0].proposed.identityVerified).toBe(true); });
  it("does not give unresolved records a fake ID", () => { expect(createCatalogIdentityBackfillPlan([record({ brand: "Unknown", name: "Mint" })])[0].proposed.canonicalProductId).toBeNull(); });
  it("excludes test records by default", () => { expect(createCatalogIdentityBackfillPlan([record({ catalogEntryType: "TEST" })])[0].action).toBe("SKIPPED_TEST"); });
  it("includes test records explicitly", () => { expect(createCatalogIdentityBackfillPlan([record({ catalogEntryType: "TEST" })], { includeTest: true })[0].action).toBe("UPDATE"); });
  it("sorts stably", () => { expect(createCatalogIdentityBackfillPlan([record({ catalogId: 20 }), record({ catalogId: 3 })]).map(item => item.catalogId)).toEqual([3, 20]); });
  it("is idempotent", async () => { const store = memoryStore([record()]); await runCatalogIdentityBackfill(store, { apply: true }); expect((await runCatalogIdentityBackfill(store, { apply: true })).counters.updates).toBe(0); });
  it("creates no new diff after repeated apply", async () => { const store = memoryStore([record()]); await runCatalogIdentityBackfill(store, { apply: true }); expect((await runCatalogIdentityBackfill(store)).items[0].action).toBe("UNCHANGED"); });
  it("limits only-unresolved mode to unresolved states", () => { const plan = createCatalogIdentityBackfillPlan([record({ catalogId: 1 }), record({ catalogId: 2, identityStatus: "AMBIGUOUS" }), record({ catalogId: 3, identityStatus: "MANUFACTURER_ONLY" })], { onlyUnresolved: true }); expect(plan.map(item => item.catalogId)).toEqual([1, 2]); });
  it("rolls back all writes after a critical failure", async () => { const store = memoryStore([record(), record({ catalogId: 2, brand: "Musthave", name: "Манго" })], 2); await expect(runCatalogIdentityBackfill(store, { apply: true })).rejects.toThrow(); expect(store.snapshot()).toEqual([record(), record({ catalogId: 2, brand: "Musthave", name: "Манго" })]); });
});

describe("migration and consistency", () => {
  it("declares persisted fields without replacing the primary key", () => { const schema = readFileSync("prisma/schema.prisma", "utf8"); expect(schema).toContain("id                   Int"); expect(schema).toContain("canonicalProductId   String?"); });
  it("keeps old catalog display fields", () => { const schema = readFileSync("prisma/schema.prisma", "utf8"); expect(schema).toContain("name                 String"); expect(schema).toContain("brandId              Int"); });
  it("reports valid persisted identity", () => { const valid = record({ manufacturerId: "darkside", canonicalProductName: "Кокос", canonicalProductId: "darkside-manufacturer-only-кокос", identityStatus: "MANUFACTURER_ONLY" }); expect(verifyPersistedCatalogIdentities([valid])).toEqual({ valid: true, checked: 1, issues: [] }); });
  it("reports duplicate persisted IDs", () => { const values = { manufacturerId: "darkside", canonicalProductName: "Кокос", canonicalProductId: "darkside-manufacturer-only-кокос", identityStatus: "MANUFACTURER_ONLY" as const }; expect(verifyPersistedCatalogIdentities([record(values), record({ ...values, catalogId: 2 })]).issues.some(issue => issue.code === "DUPLICATE_CANONICAL_PRODUCT_ID")).toBe(true); });
  it("calculates production coverage without test records", () => { const coverage = calculateCatalogIdentityCoverage([record({ identityStatus: "MANUFACTURER_ONLY" }), record({ catalogId: 2, brand: "Unknown", name: "Mint" }), record({ catalogId: 3, catalogEntryType: "TEST" })]); expect(coverage).toMatchObject({ realCatalogEntries: 2, testCatalogEntries: 1, manufacturerOnly: 1, unresolved: 1, missingManufacturers: ["Unknown"] }); });
});
