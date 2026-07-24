import { describe, expect, it } from "vitest";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../tobacco-identity-decisions";
import * as publicApi from "./index";
import { PRODUCT_FLAVOR_PROFILES_BATCH_1 } from "./batch-1";
import { PRODUCT_FLAVOR_PROFILES_BATCH_2 } from "./batch-2";
import { PRODUCT_FLAVOR_PROFILES_BATCH_3 } from "./batch-3";
import { PRODUCT_FLAVOR_PROFILES_BATCH_4 } from "./batch-4";
import { PRODUCT_FLAVOR_PROFILES_BATCH_5 } from "./batch-5";
import { PRODUCT_FLAVOR_PROFILES_BATCH_6 } from "./batch-6";
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

const BATCH_3_CANONICAL_PRODUCT_IDS = [
  "chabacco-medium-belgian-cider", "chabacco-mix-apelsin-slivki", "chabacco-mix-bananovyi-milksheik",
  "chabacco-mix-fruktovyi-led", "chabacco-mix-grenadin-drops", "chabacco-moroznaya-myata",
  "element-air-milky-mouse", "musthave-maple-pecan", "musthave-pineapple-rings", "musthave-vanilla-cream",
  "sapphire-crown-apple-strudel", "sapphire-crown-blueberry-granola", "sapphire-crown-fragrant-blackcurrant",
  "sapphire-crown-kiwi-fruit", "sapphire-crown-lemon-lime",
] as const;

const BATCH_4_CANONICAL_PRODUCT_IDS = [
  "sapphire-crown-mejumi", "brusko-medium-tsitrusovyi-chai", "husky-caipirinha", "husky-marzipan",
  "husky-passion-fruit", "husky-pineapple", "overdose-coffee", "overdose-strawberry", "banger-apricot-jam",
  "dozaj-mint", "duft-solo-cherry-juice", "duft-solo-orange-zest", "endorphin-apple", "endorphin-napoleon",
  "fake-holod",
] as const;

const BATCH_5_CANONICAL_PRODUCT_IDS = [
  "fake-mumbai-tea", "hook-granatovyi", "hook-inzhirnyi", "jam-granatovyi-sok", "jam-konfety-s-ananasom",
  "jam-krasnaya-smorodina", "mattpear-ginger-feel", "nash-black-line-arbuz", "peter-ralf-dolce-de-lechee",
  "sarma-360-ogurechnyi-limonad", "sarma-classic-bananovoe-sufle", "severnyi-krepkii-oreshek",
  "severnyi-sekvoiya", "smoke-angels-firestarter", "take-pineapple",
] as const;

const BATCH_6_CANONICAL_PRODUCT_IDS = [
  "urban-soul-strawberry", "musthave-apple-drops", "sapphire-crown-pumpkin-raf", "sapphire-crown-sunny-peach",
  "sapphire-crown-yuzu-honey", "deus-perfume-black-afgano", "element-earth-wildberry-mors", "sarma-360-dzhin",
  "sarma-360-gornaya-lavanda", "sarma-360-light-shampanskoe", "sarma-360-persik",
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

  it("batch 3 contains exactly its 15 deterministic canonical product IDs", () => {
    expect(PRODUCT_FLAVOR_PROFILES_BATCH_3.map(profile => profile.canonicalProductId).sort()).toEqual([...BATCH_3_CANONICAL_PRODUCT_IDS].sort());
    expect(PRODUCT_FLAVOR_PROFILES_BATCH_3).toHaveLength(15);
  });

  it("batch 4 contains exactly its 15 deterministic canonical product IDs", () => {
    expect(PRODUCT_FLAVOR_PROFILES_BATCH_4.map(profile => profile.canonicalProductId).sort()).toEqual([...BATCH_4_CANONICAL_PRODUCT_IDS].sort());
    expect(PRODUCT_FLAVOR_PROFILES_BATCH_4).toHaveLength(15);
  });

  it("batch 5 contains exactly its 15 deterministic canonical product IDs", () => {
    expect(PRODUCT_FLAVOR_PROFILES_BATCH_5.map(profile => profile.canonicalProductId).sort()).toEqual([...BATCH_5_CANONICAL_PRODUCT_IDS].sort());
    expect(PRODUCT_FLAVOR_PROFILES_BATCH_5).toHaveLength(15);
  });

  it("batch 6 contains exactly its 11 deterministic canonical product IDs", () => {
    expect(PRODUCT_FLAVOR_PROFILES_BATCH_6.map(profile => profile.canonicalProductId).sort()).toEqual([...BATCH_6_CANONICAL_PRODUCT_IDS].sort());
    expect(PRODUCT_FLAVOR_PROFILES_BATCH_6).toHaveLength(11);
  });

  it("no batch repeats a canonicalProductId already covered by an earlier batch", () => {
    const batches = [BATCH_1_CANONICAL_PRODUCT_IDS, BATCH_2_CANONICAL_PRODUCT_IDS, BATCH_3_CANONICAL_PRODUCT_IDS, BATCH_4_CANONICAL_PRODUCT_IDS, BATCH_5_CANONICAL_PRODUCT_IDS, BATCH_6_CANONICAL_PRODUCT_IDS];
    for (let later = 1; later < batches.length; later += 1) {
      for (let earlier = 0; earlier < later; earlier += 1) {
        const overlap = batches[later]!.filter(id => (batches[earlier] as readonly string[]).includes(id));
        expect(overlap).toEqual([]);
      }
    }
  });

  it("contains exactly the deterministic batch 1 + batch 2 + batch 3 + batch 4 + batch 5 + batch 6 canonical product IDs", () => {
    const expected = [...BATCH_1_CANONICAL_PRODUCT_IDS, ...BATCH_2_CANONICAL_PRODUCT_IDS, ...BATCH_3_CANONICAL_PRODUCT_IDS, ...BATCH_4_CANONICAL_PRODUCT_IDS, ...BATCH_5_CANONICAL_PRODUCT_IDS, ...BATCH_6_CANONICAL_PRODUCT_IDS].sort();
    expect(PRODUCT_FLAVOR_PROFILE_REGISTRY.map(profile => profile.canonicalProductId).sort()).toEqual(expected);
    expect(PRODUCT_FLAVOR_PROFILE_REGISTRY).toHaveLength(86);
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
    const sparse = PRODUCT_FLAVOR_PROFILE_REGISTRY.find(profile => profile.canonicalProductId === "husky-kiwano");
    expect(Object.keys(sparse?.dimensions ?? {})).toEqual(["strength"]);
    expect(sparse?.dimensions.sweetness).toBeUndefined();
    expect(sparse?.dimensions.sourness).toBeUndefined();
    expect(sparse?.dimensions.freshness).toBeUndefined();
    expect(sparse?.dimensions.intensity).toBeUndefined();
    expect(sparse?.dimensions.heatResistance).toBeUndefined();
    expect(sparse?.dimensions.juiciness).toBeUndefined();
  });

  it("leaves dozaj-mint with no invented dimensions when no independent flavor description was found", () => {
    const sparse = PRODUCT_FLAVOR_PROFILE_REGISTRY.find(profile => profile.canonicalProductId === "dozaj-mint");
    expect(sparse?.dimensions).toEqual({});
    expect(sparse?.overallConfidence).toBe("LOW");
    expect(sparse?.dominantNoteIds).toEqual(["MINT"]);
  });

  it.each([
    ["jam-spelaya-marakuiya", ["heatResistance", "strength"]],
    ["blackburn-almond-pear", ["heatResistance", "strength"]],
    ["husky-kiwano", ["strength"]],
    ["take-pineapple", ["strength"]],
  ] as const)("leaves %s without invented dimensions beyond %s when no independent flavor description was found for the rest", (canonicalProductId, expectedKeys) => {
    const sparse = PRODUCT_FLAVOR_PROFILE_REGISTRY.find(profile => profile.canonicalProductId === canonicalProductId);
    expect(Object.keys(sparse?.dimensions ?? {}).sort()).toEqual([...expectedKeys].sort());
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
    expect(ids).toHaveLength(86);
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

  it("preserves canonicalProductId, dominantNoteIds, overallConfidence and the same dimension keys", () => {
    const profile = PRODUCT_FLAVOR_PROFILE_REGISTRY.find(item => item.canonicalProductId === "urban-soul-pineapple")!;
    const publicProfile = publicApi.mapProductFlavorProfileToPublic(profile);
    expect(publicProfile.canonicalProductId).toBe("urban-soul-pineapple");
    expect(publicProfile.dominantNoteIds).toEqual(["FRUIT", "TROPICAL"]);
    expect(publicProfile.overallConfidence).toBe(profile.overallConfidence);
    expect(Object.keys(publicProfile.dimensions).sort()).toEqual(Object.keys(profile.dimensions).sort());
  });

  // ADR-016: dataCompleteness is a separate axis from overallConfidence, computed at mapping time.
  it("computes dataCompleteness (ADR-016) from the number of filled dimensions, independent of overallConfidence", () => {
    const profile = PRODUCT_FLAVOR_PROFILE_REGISTRY.find(item => item.canonicalProductId === "urban-soul-pineapple")!;
    expect(Object.keys(profile.dimensions)).toHaveLength(2);
    expect(publicApi.mapProductFlavorProfileToPublic(profile).dataCompleteness).toBe("BASIC");
  });
});

describe("calculateDataCompleteness (ADR-016)", () => {
  it.each([
    [0, "MINIMAL"], [1, "MINIMAL"],
    [2, "BASIC"], [3, "BASIC"],
    [4, "GOOD"], [5, "GOOD"],
    [6, "DETAILED"], [7, "DETAILED"],
  ] as const)("маппит %i заполненных измерений на %s", (filledCount, expected) => {
    const dimensions = Object.fromEntries(["sweetness", "sourness", "freshness", "intensity", "strength", "heatResistance", "juiciness"].slice(0, filledCount).map(field => [field, { value: 5, confidence: "MEDIUM", evidence: [] }]));
    expect(publicApi.calculateDataCompleteness({ dimensions })).toBe(expected);
  });

  it("не смешивается с overallConfidence - оба факта видны раздельно", () => {
    const lowCompletenessButConfident = { dimensions: { strength: { value: 5, confidence: "MEDIUM" as const, evidence: [] } }, canonicalProductId: "x", dominantNoteIds: [] as const, overallConfidence: "MEDIUM" as const };
    expect(publicApi.calculateDataCompleteness(lowCompletenessButConfident)).toBe("MINIMAL");
    expect(lowCompletenessButConfident.overallConfidence).toBe("MEDIUM");
  });

  it("реальное распределение по всем 86 продуктам соответствует ADR-016 (DETAILED 4, GOOD 28, BASIC 47, MINIMAL 7)", () => {
    const counts = { DETAILED: 0, GOOD: 0, BASIC: 0, MINIMAL: 0 };
    PRODUCT_FLAVOR_PROFILE_REGISTRY.forEach(profile => { counts[publicApi.calculateDataCompleteness(profile)] += 1; });
    expect(counts).toEqual({ DETAILED: 4, GOOD: 28, BASIC: 47, MINIMAL: 7 });
  });
});
