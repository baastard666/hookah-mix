import { describe, expect, it } from "vitest";
import {
  ASCII_CANONICAL_PRODUCT_ID_PATTERN,
  auditTobaccoIdentityDecisions,
  createAsciiCanonicalSlug,
  createCanonicalTobaccoProductId,
  createDecisionFixture,
  createLegacyCanonicalProductIdAliasRegistry,
  LEGACY_CANONICAL_PRODUCT_ID_ALIASES,
  LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY,
  mapTobaccoIdentityDecisionToPublic,
  P0_IDENTITY_DECISIONS_BATCH_1,
  P1_IDENTITY_DECISIONS_BATCH_1,
  selectCanonicalProductSlug,
  TOBACCO_IDENTITY_DECISION_REGISTRY,
  transliterateRussianText,
  validateLegacyCanonicalProductIdAliases,
  validateTobaccoIdentityDecision,
} from ".";
import type { LegacyCanonicalProductIdAlias } from "./types";

const legacy = (legacyCanonicalProductId: string, canonicalProductId: string): LegacyCanonicalProductIdAlias => ({ legacyCanonicalProductId, canonicalProductId, reason: "ASCII_TRANSLITERATION_POLICY" });

describe("ASCII canonical product ID policy", () => {
  it("transliterates the complete lowercase Russian alphabet", () => {
    expect(transliterateRussianText("абвгдеёжзийклмнопрстуфхцчшщъыьэюя")).toBe("abvgdeezhziiklmnoprstufkhtschshshchyeyuya");
  });
  it("transliterates uppercase Cyrillic identically", () => expect(transliterateRussianText("АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ")).toBe("abvgdeezhziiklmnoprstufkhtschshshchyeyuya"));
  it.each([
    ["ё", "e"], ["й", "i"], ["ъ", ""], ["ь", ""], ["ы", "y"], ["э", "e"], ["ю", "yu"], ["я", "ya"],
  ])("transliterates %s as %s", (source, expected) => expect(transliterateRussianText(source)).toBe(expected));
  it.each([
    ["Гренадин Drops", "grenadin-drops"],
    ["Cherry Juice", "cherry-juice"],
    ["Апельсин-сливки", "apelsin-slivki"],
    ["Карамель-цитрус", "karamel-tsitrus"],
    ["Go Bananas", "go-bananas"],
    ["Tic Tac", "tic-tac"],
  ])("creates a mixed-language slug for %s", (source, expected) => expect(createAsciiCanonicalSlug(source)).toBe(expected));
  it.each([
    ["два слова", "dva-slova"],
    ["два/слова", "dva-slova"],
    ["два_слова", "dva-slova"],
    ["два---слова", "dva-slova"],
    ["  два / _ --- слова!!!  ", "dva-slova"],
  ])("normalizes separators in %s", (source, expected) => expect(createAsciiCanonicalSlug(source)).toBe(expected));
  it("normalizes Latin case without locale-sensitive APIs", () => expect(createAsciiCanonicalSlug("Istanbul MIX ЁЖ")).toBe("istanbul-mix-ezh"));
  it("is deterministic across repeated calls", () => expect(new Set(Array.from({ length: 20 }, () => createAsciiCanonicalSlug("Цитрусовый чай / Drops")))).toEqual(new Set(["tsitrusovyi-chai-drops"])));
  it("produces only the canonical ASCII regex", () => expect(ASCII_CANONICAL_PRODUCT_ID_PATTERN.test(createAsciiCanonicalSlug("Гренадин Drops"))).toBe(true));
  it("creates an ID with product line", () => expect(createCanonicalTobaccoProductId("brusko", "brusko-medium", "Цитрусовый чай")).toBe("brusko-medium-tsitrusovyi-chai"));
  it("creates an ID without product line", () => expect(createCanonicalTobaccoProductId("daily-hookah", null, "Сливочный крем")).toBe("daily-hookah-slivochnyi-krem"));
  it("uses a confirmed official English name when explicitly supplied", () => expect(selectCanonicalProductSlug({ canonicalDisplayName: "Абрикосовый джем", officialEnglishCanonicalName: "Apricot Jam" })).toBe("apricot-jam"));
  it("falls back to transliteration when official English is absent", () => expect(selectCanonicalProductSlug({ canonicalDisplayName: "Абрикосовый джем" })).toBe("abrikosovyi-dzhem"));
  it("does not invent a semantic English translation", () => expect(selectCanonicalProductSlug({ canonicalDisplayName: "Цитрусовый чай" })).toBe("tsitrusovyi-chai"));
});

describe("ASCII decision validation and collision detection", () => {
  it.each([
    ["brand-продукт", "CANONICAL_ID_NON_ASCII"],
    ["Brand-product", "CANONICAL_ID_INVALID"],
    ["brand product", "CANONICAL_ID_INVALID"],
    ["brand_product", "CANONICAL_ID_INVALID"],
    ["brand--product", "CANONICAL_ID_INVALID"],
    ["-brand-product", "CANONICAL_ID_INVALID"],
    ["brand-product-", "CANONICAL_ID_INVALID"],
    ["product", "CANONICAL_ID_INVALID"],
  ])("rejects invalid canonical ID %s", (canonicalProductId, issueCode) => {
    expect(validateTobaccoIdentityDecision(createDecisionFixture({ id: `invalid-${canonicalProductId}`, canonicalProductId })).issues.map(item => item.code)).toContain(issueCode);
  });
  it("rejects an empty canonical ID", () => expect(validateTobaccoIdentityDecision(createDecisionFixture({ id: "empty-id", canonicalProductId: "" })).issues.map(item => item.code)).toContain("DECISION_CANONICAL_ID_MISSING"));
  it("returns a typed transliteration collision", () => {
    const first = createDecisionFixture({ id: "translit-a", productName: "Ёлка" });
    const second = createDecisionFixture({ id: "translit-b", productName: "Елка" });
    expect(auditTobaccoIdentityDecisions([first, second]).map(item => item.code)).toContain("CANONICAL_ID_TRANSLITERATION_COLLISION");
  });
});

describe("legacy canonical product ID aliases", () => {
  it("contains the 12 authoritative and six historical generated Unicode IDs", () => expect(LEGACY_CANONICAL_PRODUCT_ID_ALIASES).toHaveLength(18));
  it("resolves every legacy ID to an ASCII canonical ID", () => {
    for (const item of LEGACY_CANONICAL_PRODUCT_ID_ALIASES) {
      expect(LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY.resolve(item.legacyCanonicalProductId)).toEqual({ status: "FOUND", legacyCanonicalProductId: item.legacyCanonicalProductId, canonicalProductId: item.canonicalProductId });
      expect(ASCII_CANONICAL_PRODUCT_ID_PATTERN.test(item.canonicalProductId)).toBe(true);
    }
  });
  it("rejects duplicate mappings", () => expect(validateLegacyCanonicalProductIdAliases([legacy("old-id", "new-id"), legacy("old-id", "new-id")]).map(item => item.code)).toContain("LEGACY_CANONICAL_ID_DUPLICATE"));
  it("rejects conflicting mappings", () => expect(validateLegacyCanonicalProductIdAliases([legacy("old-id", "new-id"), legacy("old-id", "other-id")]).map(item => item.code)).toContain("LEGACY_CANONICAL_ID_CONFLICT"));
  it("rejects cyclic mappings", () => expect(validateLegacyCanonicalProductIdAliases([legacy("old-a", "old-b"), legacy("old-b", "old-a")]).map(item => item.code)).toContain("LEGACY_CANONICAL_ID_CYCLE"));
  it("rejects a self alias", () => expect(validateLegacyCanonicalProductIdAliases([legacy("same-id", "same-id")]).map(item => item.code)).toContain("LEGACY_CANONICAL_ID_CONFLICT"));
  it("is immutable", () => {
    expect(Object.isFrozen(LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY)).toBe(true);
    expect(Object.isFrozen(LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY.list())).toBe(true);
    expect(Object.isFrozen(LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY.list()[0])).toBe(true);
  });
  it("exact lookup by an old ID returns a decision containing the new ID", () => expect(TOBACCO_IDENTITY_DECISION_REGISTRY.getByCanonicalProductId("brusko-medium-цитрусовый-чай")).toMatchObject({ status: "FOUND", decision: { decision: { canonicalProductId: "brusko-medium-tsitrusovyi-chai" } } }));
  it("does not treat a new ID as its own legacy alias", () => expect(LEGACY_CANONICAL_PRODUCT_ID_ALIAS_REGISTRY.resolve("brusko-medium-tsitrusovyi-chai")).toEqual({ status: "NOT_FOUND" }));
  it("public-safe output exposes only new ASCII IDs", () => {
    const output = [...P1_IDENTITY_DECISIONS_BATCH_1, ...P0_IDENTITY_DECISIONS_BATCH_1].map(mapTobaccoIdentityDecisionToPublic);
    expect(output.filter(item => item.canonicalProductId).every(item => ASCII_CANONICAL_PRODUCT_ID_PATTERN.test(item.canonicalProductId!))).toBe(true);
    expect(JSON.stringify(output)).not.toContain("brusko-medium-цитрусовый-чай");
  });
  it("throws when constructing an invalid alias registry", () => expect(() => createLegacyCanonicalProductIdAliasRegistry([legacy("old-a", "old-b"), legacy("old-b", "old-a")])).toThrow());
});
