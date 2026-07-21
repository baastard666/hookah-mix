import { describe, expect, it } from "vitest";
import * as profileApi from "../tobacco-profile";
import type { ManufacturerProfile, ProductLineProfile } from "../tobacco-profile";
import { adaptCatalogTobaccoForIdentity, auditTobaccoCatalogEntries, normalizeTobaccoIdentityText, resolveCatalogTobaccoIdentity } from "./index";
import { resolveCatalogTobaccoIdentityWithDirectory } from "./resolver";

const resolved = (input: Parameters<typeof resolveCatalogTobaccoIdentity>[0]) => {
  const result = resolveCatalogTobaccoIdentity(input);
  if (result.status !== "RESOLVED") throw new Error(`Expected RESOLVED, got ${result.status}`);
  return result;
};

describe("tobacco product identity", () => {
  it("resolves a canonical manufacturer and explicit canonical line", () => {
    expect(resolved({ brand: "Darkside", productLine: "Core", name: "Lemon Blast" })).toMatchObject({ manufacturer: "Darkside", productLine: "Core", productName: "Lemon Blast", matchType: "EXPLICIT_FIELDS", confidence: "HIGH" });
  });
  it("resolves a manufacturer alias", () => { expect(resolveCatalogTobaccoIdentity({ brand: "MUSTHAVE", productLine: null, name: "Mango" })).toMatchObject({ status: "MANUFACTURER_ONLY", manufacturer: "Musthave" }); });
  it.each(["darkside", "DARKSIDE", "  Darkside  "])("normalizes manufacturer %s", brand => { expect(resolveCatalogTobaccoIdentity({ brand, name: "Coconut" }).status).toBe("MANUFACTURER_ONLY"); });
  it("rejects an unknown manufacturer", () => { expect(resolveCatalogTobaccoIdentity({ brand: "Dark Side Maybe", name: "Core Lemon" })).toMatchObject({ status: "MANUFACTURER_NOT_FOUND", reasonCodes: ["UNKNOWN_MANUFACTURER"] }); });
  it("rejects empty input", () => { expect(resolveCatalogTobaccoIdentity({ brand: " ", name: null })).toMatchObject({ status: "INVALID_INPUT", reasonCodes: ["EMPTY_BRAND_AND_NAME"] }); });

  it("resolves an explicit line alias", () => { expect(resolved({ brand: "Darkside", productLine: "Darkside Core", name: "Lemon" }).productLine).toBe("Core"); });
  it("extracts a line from the beginning of name", () => { expect(resolved({ brand: "Darkside", name: "Core Lemon Blast" })).toMatchObject({ productLine: "Core", productName: "Lemon Blast", matchType: "CONTROLLED_NAME_PREFIX" }); });
  it("extracts manufacturer and line from a complete name", () => { expect(resolved({ name: "Darkside Rare Pear" })).toMatchObject({ manufacturer: "Darkside", productLine: "Rare", productName: "Pear" }); });
  it("supports Russian line aliases", () => { expect(resolved({ brand: "Хулиган", name: "Хулиган Medium Персик" })).toMatchObject({ productLine: "Medium", productName: "Персик" }); });
  it("supports English line aliases", () => { expect(resolved({ brand: "Hooligan", name: "Hooligan Hard Peach" })).toMatchObject({ manufacturer: "Хулиган", productLine: "Hard" }); });
  it("supports registered abbreviated aliases", () => { expect(resolved({ brand: "HLGN", name: "HLGN Medium Peach" })).toMatchObject({ manufacturer: "Хулиган", productLine: "Medium" }); });
  it("rejects an unknown explicit line", () => { expect(resolveCatalogTobaccoIdentity({ brand: "Darkside", productLine: "Ultra", name: "Lemon" })).toMatchObject({ status: "PRODUCT_LINE_NOT_FOUND", reasonCodes: ["UNKNOWN_EXPLICIT_PRODUCT_LINE"] }); });
  it("returns manufacturer only when line is absent", () => { expect(resolveCatalogTobaccoIdentity({ brand: "Darkside", name: "Lemon Blast" })).toMatchObject({ status: "MANUFACTURER_ONLY", manufacturer: "Darkside", reasonCodes: ["PRODUCT_LINE_NOT_DETECTED"] }); });
  it("does not extract a line from the middle", () => { expect(resolveCatalogTobaccoIdentity({ brand: "Darkside", name: "Something Core Lemon" }).status).toBe("MANUFACTURER_ONLY"); });
  it("keeps explicit line and warns about a conflicting prefix", () => { expect(resolved({ brand: "Darkside", productLine: "Core", name: "Rare Pear" })).toMatchObject({ productLine: "Core", productName: "Pear", warnings: ["EXPLICIT_PRODUCT_LINE_CONFLICTS_WITH_NAME_PREFIX"] }); });

  it("returns ambiguous for equal aliases mapped to distinct lines", () => {
    const manufacturer: ManufacturerProfile = { manufacturerId: "synthetic", manufacturer: "Synthetic", aliases: [], dataConfidence: "LOW", sourceTypes: [], notes: [] };
    const base = { manufacturerId: "synthetic", manufacturer: "Synthetic", aliases: ["Mix"], dataConfidence: "LOW" as const, sourceTypes: [] as const, notes: [] as const };
    const lines: ProductLineProfile[] = [{ ...base, productLineId: "synthetic-a", productLine: "A" }, { ...base, productLineId: "synthetic-b", productLine: "B" }];
    expect(resolveCatalogTobaccoIdentityWithDirectory({ brand: "Synthetic", name: "Mix Flavor" }, { manufacturers: [manufacturer], productLines: lines })).toMatchObject({ status: "AMBIGUOUS", reasonCodes: ["MULTIPLE_PRODUCT_LINE_MATCHES"], candidates: ["A", "B"] });
  });

  it("removes manufacturer and line prefixes", () => { expect(resolved({ name: "MUASSEL Strong Cola" }).productName).toBe("Cola"); });
  it("preserves the remaining product name", () => { expect(resolved({ brand: "Darkside", name: "Core Lemon Mint Blast" }).productName).toBe("Lemon Mint Blast"); });
  it("rejects an empty product name after stripping", () => { expect(resolveCatalogTobaccoIdentity({ brand: "Darkside", name: "Core" })).toMatchObject({ status: "INVALID_INPUT", reasonCodes: ["EMPTY_PRODUCT_NAME"] }); });
  it("creates a deterministic product id", () => { const input = { brand: "Darkside", productLine: "Core", name: "Lemon Blast" }; expect(resolved(input).productId).toBe("darkside-core-lemon-blast"); expect(resolved(input)).toEqual(resolved(input)); });
  it("creates an ASCII product ID for Cyrillic display names", () => { expect(resolved({ brand: "Хулиган", productLine: "Medium", name: "Ягодный микс" }).productId).toBe("hooligan-medium-yagodnyi-miks"); });
  it("normalizes hyphens and multiple spaces", () => { const result = resolved({ brand: "Darkside", productLine: "Core", name: " Lemon — Mint   Blast " }); expect(result.productName).toBe("Lemon-Mint Blast"); expect(result.productId).toBe("darkside-core-lemon-mint-blast"); });
  it("normalizes identity text without deleting words", () => { expect(normalizeTobaccoIdentityText("  Darkside — Core  Lemon ")).toBe("darkside-core lemon"); });

  it("adapts the current catalog shape", () => { expect(adaptCatalogTobaccoForIdentity({ id: 5, brand: { name: "Darkside" }, name: "Кокос" })).toEqual({ catalogId: 5, brand: "Darkside", productLine: null, name: "Кокос" }); });
  it("calculates audit counters", () => { const audit = auditTobaccoCatalogEntries([{ catalogId: 1, brand: "Darkside", productLine: "Core", name: "Lemon" }, { catalogId: 2, brand: "Darkside", name: "Coconut" }, { catalogId: 3, brand: "Unknown", name: "Mint" }, { catalogId: 4 }]); expect(audit.counters).toMatchObject({ total: 4, resolved: 1, manufacturerOnly: 1, manufacturerNotFound: 1, invalidInput: 1 }); });
  it("preserves original fields for audit diagnostics", () => { const result = auditTobaccoCatalogEntries([{ catalogId: 7, brand: "  UNKNOWN Brand  ", name: "  Mint  " }]).problems[0]; expect(result.originalInput).toEqual({ catalogId: 7, brand: "  UNKNOWN Brand  ", productLine: null, name: "  Mint  " }); });
  it("detects duplicate candidates only after resolution", () => { const audit = auditTobaccoCatalogEntries([{ catalogId: 2, brand: "Darkside", productLine: "Core", name: "Lemon" }, { catalogId: 1, brand: "DARKSIDE", productLine: "Core", name: "Lemon" }]); expect(audit.duplicateCandidates).toEqual([{ productId: "darkside-core-lemon", displayName: "Darkside Core Lemon", catalogIds: [1, 2] }]); });
  it("sorts audit results stably", () => { expect(auditTobaccoCatalogEntries([{ catalogId: 20, brand: "Unknown", name: "B" }, { catalogId: 3, brand: "Unknown", name: "A" }]).resolutions.map(item => item.catalogId)).toEqual([3, 20]); });
  it("does not report a duplicate without distinct catalog ids", () => { const audit = auditTobaccoCatalogEntries([{ brand: "Darkside", productLine: "Core", name: "Lemon" }, { brand: "Darkside", productLine: "Core", name: "Lemon" }]); expect(audit.duplicateCandidates).toEqual([]); });
  it("does not mutate audit input", () => { const entries = [{ catalogId: 1, brand: "Darkside", productLine: "Core", name: "Lemon" }] as const; const before = JSON.stringify(entries); auditTobaccoCatalogEntries(entries); expect(JSON.stringify(entries)).toBe(before); });
  it("returns the same audit for the same input", () => { const entries = [{ catalogId: 1, brand: "Darkside", productLine: "Core", name: "Lemon" }]; expect(auditTobaccoCatalogEntries(entries)).toEqual(auditTobaccoCatalogEntries(entries)); });
  it("uses the public registry without mutations", () => { const before = JSON.stringify(profileApi.listProductLineProfiles()); resolveCatalogTobaccoIdentity({ brand: "Darkside", name: "Core Lemon" }); expect(JSON.stringify(profileApi.listProductLineProfiles())).toBe(before); expect("TOBACCO_PROFILE_REGISTRY" in profileApi).toBe(false); });
});
