import { describe, expect, it } from "vitest";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../tobacco-identity-decisions";
import * as publicApi from "./index";
import { PRODUCT_FLAVOR_PROFILES_BATCH_1 } from "./batch-1";
import { PRODUCT_FLAVOR_PROFILES_BATCH_2 } from "./batch-2";
import { PRODUCT_FLAVOR_PROFILE_REGISTRY } from "./registry";
import { validateProductFlavorProfile, validateProductFlavorProfiles } from "./validation";
import type { ProductFlavorProfile } from "./types";

const BATCH_1_CANONICAL_PRODUCT_IDS = [
  "sapphire-crown-dried-plum", "sapphire-crown-go-bananas", "musthave-sorbetto", "blackburn-na-rasslabone",
  "blackburn-klyukvennyi-mors", "blackburn-na-chille", "musthave-blackberry", "musthave-sour-berries",
  "blackburn-tic-tac", "blackburn-ice-baby", "musthave-sour-tropic", "musthave-sour-citrus",
  "sapphire-crown-pineapple-fanta", "urban-soul-pineapple", "nash-white-line-karamel-tsitrus",
] as const;

const BATCH_2_CANONICAL_PRODUCT_IDS = [
  "daily-hookah-slivochnyi-krem", "deus-skittles", "overdose-masala-tea", "urban-soul-berry-marmalade",
  "blackburn-shock-raspberry", "overdose-jelly-grape", "blackburn-green-tea", "jam-arbuznyi-rondo",
  "jam-spelaya-marakuiya", "hook-limon-laim", "blackburn-almond-pear", "overdose-samarkand-melon",
  "husky-kiwano", "overdose-apple-juicy", "sapphire-crown-bitter-cherry",
] as const;

const validProfile: ProductFlavorProfile = {
  canonicalProductId: "musthave-sorbetto",
  dimensions: { sweetness: { value: 7, confidence: "MEDIUM", evidence: [{ type: "MANUFACTURER_CLAIM", title: "test", checkedAt: "2026-07-23" }] } },
  dominantNoteIds: ["BERRY"],
  overallConfidence: "MEDIUM",
};

describe("product flavor profile registry", () => {
  it("batch 1 contains exactly its 15 deterministic canonical product IDs", () => {
    expect(PRODUCT_FLAVOR_PROFILES_BATCH_1.map(profile => profile.canonicalProductId).sort()).toEqual([...BATCH_1_CANONICAL_PRODUCT_IDS].sort());
    expect(PRODUCT_FLAVOR_PROFILES_BATCH_1).toHaveLength(15);
  });

  it("batch 2 contains exactly its 15 deterministic canonical product IDs", () => {
    expect(PRODUCT_FLAVOR_PROFILES_BATCH_2.map(profile => profile.canonicalProductId).sort()).toEqual([...BATCH_2_CANONICAL_PRODUCT_IDS].sort());
    expect(PRODUCT_FLAVOR_PROFILES_BATCH_2).toHaveLength(15);
  });

  it("batch 2 does not repeat any canonicalProductId already covered by batch 1", () => {
    const overlap = BATCH_2_CANONICAL_PRODUCT_IDS.filter(id => (BATCH_1_CANONICAL_PRODUCT_IDS as readonly string[]).includes(id));
    expect(overlap).toEqual([]);
  });

  it("contains exactly the deterministic batch 1 + batch 2 canonical product IDs", () => {
    const expected = [...BATCH_1_CANONICAL_PRODUCT_IDS, ...BATCH_2_CANONICAL_PRODUCT_IDS].sort();
    expect(PRODUCT_FLAVOR_PROFILE_REGISTRY.map(profile => profile.canonicalProductId).sort()).toEqual(expected);
    expect(PRODUCT_FLAVOR_PROFILE_REGISTRY).toHaveLength(30);
  });

  it("references only RESOLVED canonicalProductId values from the Tobacco Identity Decision Registry", () => {
    PRODUCT_FLAVOR_PROFILE_REGISTRY.forEach(profile => {
      const lookup = TOBACCO_IDENTITY_DECISION_REGISTRY.getByCanonicalProductId(profile.canonicalProductId);
      expect(lookup.status).toBe("FOUND");
      if (lookup.status === "FOUND") expect(lookup.decision.decision.status).toBe("RESOLVED");
    });
  });

  it("never sets overallConfidence above the minimum confidence among filled dimensions", () => {
    PRODUCT_FLAVOR_PROFILE_REGISTRY.forEach(profile => {
      const rank = { LOW: 0, MEDIUM: 1, HIGH: 2 } as const;
      const filled = Object.values(profile.dimensions).filter((value): value is NonNullable<typeof value> => value !== undefined);
      const minimum = filled.length ? filled.reduce<"LOW" | "MEDIUM" | "HIGH">((lowest, value) => (rank[value.confidence] < rank[lowest] ? value.confidence : lowest), "HIGH") : "LOW";
      expect(rank[profile.overallConfidence]).toBeLessThanOrEqual(rank[minimum]);
    });
  });

  it("gives every filled dimension at least one evidence entry with a value in 0-10", () => {
    PRODUCT_FLAVOR_PROFILE_REGISTRY.forEach(profile => {
      Object.values(profile.dimensions).forEach(value => {
        if (!value) return;
        expect(value.evidence.length).toBeGreaterThan(0);
        expect(value.value).toBeGreaterThanOrEqual(0);
        expect(value.value).toBeLessThanOrEqual(10);
      });
    });
  });

  it("never assigns HIGH confidence to a subjective taste dimension", () => {
    PRODUCT_FLAVOR_PROFILE_REGISTRY.forEach(profile => {
      Object.values(profile.dimensions).forEach(value => { if (value) expect(value.confidence).not.toBe("HIGH"); });
    });
  });

  it("only references dominant note categories that exist in the Flavor Knowledge Layer", () => {
    PRODUCT_FLAVOR_PROFILE_REGISTRY.forEach(profile => {
      expect(profile.dominantNoteIds.length).toBeGreaterThan(0);
      expect(validateProductFlavorProfile(profile).filter(entry => entry.code === "DOMINANT_NOTE_ID_UNKNOWN")).toEqual([]);
    });
  });

  it("does not report validation issues for the shipped registry", () => {
    expect(validateProductFlavorProfiles(PRODUCT_FLAVOR_PROFILE_REGISTRY)).toEqual([]);
  });

  it("allows partial dimension coverage without inventing missing values", () => {
    const sparse = PRODUCT_FLAVOR_PROFILE_REGISTRY.find(profile => profile.canonicalProductId === "urban-soul-pineapple");
    expect(sparse?.dimensions).toEqual({});
    expect(sparse?.overallConfidence).toBe("LOW");
  });

  it.each(["jam-spelaya-marakuiya", "blackburn-almond-pear", "husky-kiwano"])("leaves %s without invented dimensions when no independent flavor description was found", canonicalProductId => {
    const sparse = PRODUCT_FLAVOR_PROFILE_REGISTRY.find(profile => profile.canonicalProductId === canonicalProductId);
    expect(sparse?.dimensions).toEqual({});
    expect(sparse?.overallConfidence).toBe("LOW");
    expect(sparse?.dominantNoteIds.length).toBeGreaterThan(0);
  });

  it("is deeply frozen and rejects mutation", () => {
    expect(Object.isFrozen(PRODUCT_FLAVOR_PROFILE_REGISTRY)).toBe(true);
    const profile = PRODUCT_FLAVOR_PROFILE_REGISTRY[0]!;
    expect(Object.isFrozen(profile)).toBe(true);
    expect(Object.isFrozen(profile.dimensions)).toBe(true);
    expect(Object.isFrozen(profile.dominantNoteIds)).toBe(true);
    expect(() => { (profile as { overallConfidence: string }).overallConfidence = "HIGH"; }).toThrow();
  });
});

describe("validateProductFlavorProfile", () => {
  it("accepts a well-formed profile", () => {
    expect(validateProductFlavorProfile(validProfile)).toEqual([]);
  });

  it("flags an unknown canonicalProductId", () => {
    const issues = validateProductFlavorProfile({ ...validProfile, canonicalProductId: "not-a-real-product" });
    expect(issues.some(entry => entry.code === "CANONICAL_PRODUCT_ID_NOT_FOUND")).toBe(true);
  });

  it("flags a canonicalProductId that is not RESOLVED", () => {
    const ambiguous = TOBACCO_IDENTITY_DECISION_REGISTRY.getByStatus("AMBIGUOUS")[0];
    expect(ambiguous).toBeDefined();
    const issues = validateProductFlavorProfile({ ...validProfile, canonicalProductId: ambiguous!.sourceIdentity.sourceGroupId });
    expect(issues.some(entry => entry.code === "CANONICAL_PRODUCT_ID_NOT_FOUND")).toBe(true);
  });

  it("flags a dimension value outside the 0-10 range", () => {
    const issues = validateProductFlavorProfile({ ...validProfile, dimensions: { sweetness: { value: 11, confidence: "LOW", evidence: [{ type: "EDITORIAL_ASSESSMENT", title: "t", checkedAt: "2026-07-23" }] } } });
    expect(issues.some(entry => entry.code === "DIMENSION_VALUE_OUT_OF_RANGE")).toBe(true);
  });

  it("flags a dimension with no evidence", () => {
    const issues = validateProductFlavorProfile({ ...validProfile, dimensions: { sweetness: { value: 5, confidence: "LOW", evidence: [] } } });
    expect(issues.some(entry => entry.code === "DIMENSION_EVIDENCE_MISSING")).toBe(true);
  });

  it("flags overallConfidence above the minimum filled dimension confidence", () => {
    const issues = validateProductFlavorProfile({ ...validProfile, dimensions: { sweetness: { value: 5, confidence: "LOW", evidence: validProfile.dimensions.sweetness!.evidence } }, overallConfidence: "HIGH" });
    expect(issues.some(entry => entry.code === "OVERALL_CONFIDENCE_EXCEEDS_MINIMUM")).toBe(true);
  });

  it("flags an unknown dominant note category", () => {
    const issues = validateProductFlavorProfile({ ...validProfile, dominantNoteIds: ["NOT_A_CATEGORY" as ProductFlavorProfile["dominantNoteIds"][number]] });
    expect(issues.some(entry => entry.code === "DOMINANT_NOTE_ID_UNKNOWN")).toBe(true);
  });

  it("flags duplicate canonicalProductId across the registry", () => {
    const issues = validateProductFlavorProfiles([validProfile, validProfile]);
    expect(issues.some(entry => entry.code === "DUPLICATE_CANONICAL_PRODUCT_ID")).toBe(true);
  });
});

describe("public query API", () => {
  it("gets a profile by canonicalProductId", () => {
    expect(publicApi.getProductFlavorProfile("musthave-sorbetto")?.canonicalProductId).toBe("musthave-sorbetto");
  });

  it("returns null for an unknown canonicalProductId", () => {
    expect(publicApi.getProductFlavorProfile("unknown-product")).toBeNull();
  });

  it("reports presence without fuzzy matching", () => {
    expect(publicApi.hasProductFlavorProfile("musthave-sorbetto")).toBe(true);
    expect(publicApi.hasProductFlavorProfile("MustHave Sorbetto")).toBe(false);
    expect(publicApi.hasProductFlavorProfile("musthave-sorbeto")).toBe(false);
  });

  it("lists all profiles sorted by canonicalProductId", () => {
    const ids = publicApi.listProductFlavorProfiles().map(profile => profile.canonicalProductId);
    expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b, "en")));
    expect(ids).toHaveLength(30);
  });

  it("returns copies rather than the internal registry objects", () => {
    expect(publicApi.getProductFlavorProfile("musthave-sorbetto")).not.toBe(PRODUCT_FLAVOR_PROFILE_REGISTRY.find(profile => profile.canonicalProductId === "musthave-sorbetto"));
  });

  it("returns deeply frozen results", () => {
    const profile = publicApi.getProductFlavorProfile("musthave-sorbetto");
    expect(Object.isFrozen(profile)).toBe(true);
    expect(Object.isFrozen(profile?.dimensions)).toBe(true);
    expect(Object.isFrozen(profile?.dominantNoteIds)).toBe(true);
  });

  it("does not export the raw registry from the public index", () => {
    expect("PRODUCT_FLAVOR_PROFILE_REGISTRY" in publicApi).toBe(false);
  });

  it("is deterministic", () => {
    expect(publicApi.getProductFlavorProfile("musthave-sorbetto")).toEqual(publicApi.getProductFlavorProfile("musthave-sorbetto"));
  });
});

describe("mapProductFlavorProfileToPublic", () => {
  it("strips reference URLs and keeps title, type and checkedAt", () => {
    const profile = PRODUCT_FLAVOR_PROFILE_REGISTRY.find(item => item.canonicalProductId === "musthave-sorbetto")!;
    const publicProfile = publicApi.mapProductFlavorProfileToPublic(profile);
    const rawEvidence = Object.values(profile.dimensions).flatMap(value => value?.evidence ?? []);
    expect(rawEvidence.some(item => item.reference)).toBe(true);
    Object.values(publicProfile.dimensions).forEach(value => {
      value?.evidence.forEach(item => { expect("reference" in item).toBe(false); });
    });
  });

  it("preserves canonicalProductId, dominantNoteIds and overallConfidence", () => {
    const profile = PRODUCT_FLAVOR_PROFILE_REGISTRY.find(item => item.canonicalProductId === "urban-soul-pineapple")!;
    const publicProfile = publicApi.mapProductFlavorProfileToPublic(profile);
    expect(publicProfile).toEqual({ canonicalProductId: "urban-soul-pineapple", dimensions: {}, dominantNoteIds: ["FRUIT", "TROPICAL"], overallConfidence: "LOW" });
  });
});
