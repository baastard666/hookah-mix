import { describe, expect, it } from "vitest";
import * as publicApi from "./index";
import { TOBACCO_PROFILE_REGISTRY } from "./registry";

const found = (manufacturer: string, productLine?: string) => {
  const result = publicApi.resolveTobaccoProfile({ manufacturer, productLine });
  if (result.status !== "FOUND") throw new Error(`Expected ${manufacturer} ${productLine ?? ""} to be found`);
  return result;
};

describe("tobacco profile registry", () => {
  it("gets a manufacturer profile", () => { expect(publicApi.getManufacturerProfile("Darkside")?.manufacturer).toBe("Darkside"); });
  it("gets a product line profile", () => { expect(publicApi.getProductLineProfile("Darkside", "Core")?.strengthLevel?.value).toBe("MEDIUM"); });
  it("inherits manufacturer heat resistance", () => { expect(found("Darkside", "Core").heatResistance).toMatchObject({ value: "HIGH", inherited: true, inheritedFrom: "Darkside", origin: "MANUFACTURER" }); });
  it("overrides a manufacturer value on the line", () => { expect(found("Хулиган", "Hard").heatResistance).toMatchObject({ value: "HIGH", inherited: false, origin: "PRODUCT_LINE" }); });
  it("preserves evidence", () => { expect(found("MUASSEL", "Medium").strengthLevel?.evidence[0]?.sourceType).toBe("MANUFACTURER_CLAIM"); });
  it("preserves confidence", () => { expect(found("Jent").heatResistance?.confidence).toBe("LOW"); });

  it.each(["Хулиган", "Hooligan", "HLGN", "  hooligan  "])("supports the declared Hooligan alias %s", alias => {
    expect(found(alias, "Medium").manufacturer).toBe("Хулиган");
  });
  it.each(["MustHave", "Must Have", "MUSTHAVE", "  musthave "])("normalizes the declared Musthave alias %s", alias => {
    expect(found(alias).manufacturer).toBe("Musthave");
  });

  it("does not invent an unknown manufacturer", () => {
    expect(publicApi.resolveTobaccoProfile({ manufacturer: "Dark Side Maybe" })).toEqual({ status: "NOT_FOUND", missing: "MANUFACTURER", manufacturer: "Dark Side Maybe", productLine: null });
  });
  it("reports an unknown line of a known manufacturer", () => {
    expect(publicApi.resolveTobaccoProfile({ manufacturer: "Darkside", productLine: "Ultra" })).toMatchObject({ status: "NOT_FOUND", missing: "PRODUCT_LINE", manufacturer: "Darkside", productLine: "Ultra" });
  });
  it("does not mutate the registry while resolving", () => {
    const before = JSON.stringify(TOBACCO_PROFILE_REGISTRY); found("Darkside", "Rare"); expect(JSON.stringify(TOBACCO_PROFILE_REGISTRY)).toBe(before);
  });
  it("is deterministic", () => {
    expect(publicApi.resolveTobaccoProfile({ manufacturer: "MUASSEL", productLine: "Extra Strong" })).toEqual(publicApi.resolveTobaccoProfile({ manufacturer: "MUASSEL", productLine: "Extra Strong" }));
  });
  it("returns deeply frozen public results", () => {
    const profile = publicApi.getManufacturerProfile("BlackBurn");
    expect(Object.isFrozen(profile)).toBe(true); expect(Object.isFrozen(profile?.aliases)).toBe(true); expect(Object.isFrozen(profile?.heatResistance?.evidence)).toBe(true);
  });
  it("returns copies rather than internal registry objects", () => { expect(publicApi.getManufacturerProfile("Darkside")).not.toBe(TOBACCO_PROFILE_REGISTRY.manufacturers[0]); });
  it("does not export the registry from the public index", () => { expect("TOBACCO_PROFILE_REGISTRY" in publicApi).toBe(false); });
  it("adapts a current Flavor-like object", () => { expect(publicApi.resolveProfileForTobacco({ brand: { name: "Darkside" }, productLine: "Core" })).toMatchObject({ status: "FOUND", manufacturer: "Darkside", productLine: "Core" }); });
  it("adapts a string brand without a line", () => { expect(publicApi.resolveProfileForTobacco({ brand: "JENT" })).toMatchObject({ status: "FOUND", manufacturer: "Jent", productLine: null }); });
  it("lists eight manufacturers and nine lines", () => { expect(publicApi.listManufacturerProfiles()).toHaveLength(8); expect(publicApi.listManufacturerProfiles().some(item => item.manufacturerId === "nash")).toBe(true); expect(publicApi.listProductLineProfiles()).toHaveLength(9); });
  it("filters lines through a manufacturer alias", () => { expect(publicApi.listProductLineProfiles("HLGN").map(item => item.productLine)).toEqual(["Hard", "Medium"]); });
  it("provides public presence queries", () => { expect(publicApi.hasManufacturerProfile("dogma")).toBe(true); expect(publicApi.hasProductLineProfile("darkside", "Sabotage")).toBe(true); expect(publicApi.hasProductLineProfile("darkside", "Unknown")).toBe(false); });
  it("keeps MUASSEL lines categorically distinct", () => {
    const medium = found("MUASSEL", "Medium"); const extra = found("MUASSEL", "Extra Strong");
    expect(medium.strengthLevel?.value).toBe("MEDIUM"); expect(medium.leafTypes?.value).toEqual(["VIRGINIA"]); expect(extra.strengthLevel?.value).toBe("HIGH"); expect(extra.leafTypes?.value).toEqual(["CIGAR"]);
  });
  it("documents Jent heat uncertainty", () => { const heat = found("Jent").heatResistance; expect(heat).toMatchObject({ value: "UNKNOWN", confidence: "LOW" }); expect(heat?.note).toContain("расходятся"); });
});
