import { describe, expect, it } from "vitest";
import { getProductFlavorProfile } from "../product-flavor-profile";
import type { ProductFlavorProfile } from "../product-flavor-profile";
import { buildBrandSlug, buildDescription, buildDisplayName, buildFlavorSlug, planFlavorImport } from "./build-import-plan";
import type { ExistingFlavorForImport, ResolvedDecisionForImport } from "./types";

const decision = (overrides: Partial<ResolvedDecisionForImport> = {}): ResolvedDecisionForImport => ({
  canonicalProductId: "test-brand-flavor",
  canonicalManufacturerName: "Test Brand",
  canonicalProductLineName: null,
  canonicalProductName: "Flavor",
  manufacturerId: "test-brand",
  productLineId: null,
  ...overrides,
});

const profile = (dimensions: ProductFlavorProfile["dimensions"] = {}): ProductFlavorProfile => ({
  canonicalProductId: "test-brand-flavor",
  dimensions,
  dominantNoteIds: ["FRUIT"],
  overallConfidence: "MEDIUM",
});

const dim = (value: number): { value: number; confidence: "MEDIUM"; evidence: [] } => ({ value, confidence: "MEDIUM", evidence: [] });

const existing = (overrides: Partial<ExistingFlavorForImport> = {}): ExistingFlavorForImport => ({
  id: 1, canonicalProductId: null, catalogEntryType: "REAL",
  strength: null, heatResistance: null, intensity: null, sweetness: null, acidity: null, juiciness: null, freshness: null,
  ...overrides,
});

describe("buildBrandSlug/buildFlavorSlug/buildDisplayName/buildDescription", () => {
  it("normalizes a manufacturer name into a Cyrillic-preserving slug", () => expect(buildBrandSlug("Sapphire Crown")).toBe("sapphire-crown"));
  it("matches the exact demo Brand.slug for overlapping manufacturers (ADR-016)", () => {
    expect(buildBrandSlug("Overdose")).toBe("overdose");
    expect(buildBrandSlug("Element")).toBe("element");
    expect(buildBrandSlug("Musthave")).toBe("musthave");
    expect(buildBrandSlug("BlackBurn")).toBe("blackburn");
    expect(buildBrandSlug("Daily Hookah")).toBe("daily-hookah");
  });
  it("folds the product line into the slug to avoid cross-line collisions", () => expect(buildFlavorSlug("Medium", "Belgian Cider")).toBe("medium-belgian-cider"));
  it("uses the bare product name when there is no product line", () => expect(buildFlavorSlug(null, "Coffee")).toBe("coffee"));
  it("matches the exact demo Flavor.slug for the known overdose-coffee collision", () => expect(buildFlavorSlug(null, "Coffee")).toBe("coffee"));
  it("description mirrors the canonical name, never invents taste prose", () => expect(buildDescription("Medium", "Belgian Cider")).toBe(buildDisplayName("Medium", "Belgian Cider")));
});

describe("planFlavorImport - action decision", () => {
  it("plans CREATE when no existing row matches", () => {
    const plan = planFlavorImport({ decision: decision(), profile: profile(), existingFlavor: null });
    expect(plan.action).toBe("CREATE");
    expect(plan.existingFlavorId).toBeNull();
    expect(plan.changedFields).toEqual([]);
  });
  it("plans SKIPPED_TEST and never proposes changes for a TEST row", () => {
    const plan = planFlavorImport({ decision: decision(), profile: profile({ sweetness: dim(7) }), existingFlavor: existing({ catalogEntryType: "TEST" }) });
    expect(plan.action).toBe("SKIPPED_TEST");
    expect(plan.changedFields).toEqual([]);
    expect(plan.warnings.some(warning => warning.includes("TEST"))).toBe(true);
  });
  it("plans UPDATE when a non-TEST row already exists", () => {
    const plan = planFlavorImport({ decision: decision(), profile: profile({ sweetness: dim(7) }), existingFlavor: existing({ sweetness: 3 }) });
    expect(plan.action).toBe("UPDATE");
    expect(plan.existingFlavorId).toBe(1);
  });
});

describe("planFlavorImport - ADR-016 п.2: evidence always wins over demo data", () => {
  it("overwrites a demo core field that disagrees with evidence", () => {
    const plan = planFlavorImport({ decision: decision(), profile: profile({ sweetness: dim(6) }), existingFlavor: existing({ sweetness: 3, canonicalProductId: null }) });
    expect(plan.changedFields).toEqual([{ field: "sweetness", from: 3, to: 6 }]);
    expect(plan.warnings.some(warning => warning.includes("demo"))).toBe(true);
  });
  it("reproduces the documented overdose-coffee collision from the real registry", () => {
    const registryProfile = getProductFlavorProfile("overdose-coffee");
    expect(registryProfile).not.toBeNull();
    const plan = planFlavorImport({
      decision: decision({ canonicalProductId: "overdose-coffee", canonicalManufacturerName: "Overdose", canonicalProductName: "Coffee" }),
      profile: registryProfile!,
      existingFlavor: existing({ sweetness: 3, heatResistance: 7, canonicalProductId: null }),
    });
    expect(plan.brandSlug).toBe("overdose");
    expect(plan.flavorSlug).toBe("coffee");
    expect(plan.action).toBe("UPDATE");
    expect(plan.changedFields).toEqual(expect.arrayContaining([
      { field: "sweetness", from: 3, to: 6 },
      { field: "heatResistance", from: 7, to: 9 },
      { field: "strength", from: null, to: 8 },
    ]));
  });
  it("does not report a changed field when the existing value already matches evidence", () => {
    const plan = planFlavorImport({ decision: decision(), profile: profile({ sweetness: dim(6) }), existingFlavor: existing({ sweetness: 6 }) });
    expect(plan.changedFields).toEqual([]);
  });
  it("never reads or writes any of the 11 secondary fields", () => {
    const plan = planFlavorImport({ decision: decision(), profile: profile({ sweetness: dim(6) }), existingFlavor: existing({ sweetness: 3 }) });
    expect(Object.keys(plan.dimensionValues).sort()).toEqual(["acidity", "freshness", "heatResistance", "intensity", "juiciness", "strength", "sweetness"].sort());
  });
  it("leaves a dimension null when the registry has no evidence for it", () => {
    const plan = planFlavorImport({ decision: decision(), profile: profile({ sweetness: dim(6) }), existingFlavor: null });
    expect(plan.dimensionValues.strength).toBeNull();
    expect(plan.dimensionValues.sweetness).toBe(6);
  });
  it("maps the registry's `sourness` dimension onto Prisma's `acidity` field", () => {
    const plan = planFlavorImport({ decision: decision(), profile: profile({ sourness: dim(4) }), existingFlavor: null });
    expect(plan.dimensionValues.acidity).toBe(4);
  });
});

describe("planFlavorImport - ADR-016 п.4: semantic near-duplicates are flagged, never merged", () => {
  it("flags the known daily-hookah-slivochnyi-krem pair with an explicit warning", () => {
    const plan = planFlavorImport({
      decision: decision({ canonicalProductId: "daily-hookah-slivochnyi-krem", canonicalManufacturerName: "Daily Hookah", canonicalProductName: "Сливочный крем" }),
      profile: profile({ sweetness: dim(6) }),
      existingFlavor: null,
    });
    expect(plan.action).toBe("CREATE");
    expect(plan.warnings.some(warning => warning.includes("Сливки"))).toBe(true);
    expect(plan.flavorSlug).not.toBe("cream");
  });
  it("does not flag an unrelated product", () => {
    const plan = planFlavorImport({ decision: decision(), profile: profile(), existingFlavor: null });
    expect(plan.warnings).toEqual([]);
  });
});

describe("planFlavorImport - dataCompleteness (ADR-016 п.1)", () => {
  it("computes DETAILED/GOOD/BASIC/MINIMAL consistently with the shared calculator", () => {
    const zero = planFlavorImport({ decision: decision(), profile: profile(), existingFlavor: null });
    expect(zero.dataCompleteness).toBe("MINIMAL");
    expect(zero.filledDimensionCount).toBe(0);
    const six = planFlavorImport({ decision: decision(), profile: profile({ sweetness: dim(1), sourness: dim(1), freshness: dim(1), intensity: dim(1), strength: dim(1), heatResistance: dim(1) }), existingFlavor: null });
    expect(six.dataCompleteness).toBe("DETAILED");
    expect(six.filledDimensionCount).toBe(6);
  });
});
