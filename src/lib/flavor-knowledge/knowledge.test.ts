import { describe, expect, it } from "vitest";
import type { MixProfileNoteResult } from "../mix-profile";
import { analyzeNoteCompatibility, getKnowledgeRelationForLegacyCategories } from "../mix-compatibility";
import { createKnowledgeCategoryRule } from "../mix-compatibility/knowledge-adapter";
import {
  FLAVOR_KNOWLEDGE_REGISTRY, FLAVOR_NOTE_CATEGORIES, areNotesRelated, areRelatedCategories,
  calculateKnowledgeConfidence, calculateKnowledgeConfidenceForClaim, findNoteByAlias,
  getCategoryDefinition, getCategoryRelation, getCategoryRelationScore, getChildCategories,
  getClaim, getClaimsForSubject, getEvidence, getNoteCategories, getNoteKnowledge,
  getParentCategory, getRelatedCategories, getRelatedNotes, isParentCategory, isSameCategory,
  toKnowledgeCategory, toLegacyCategory, validateEvidence, validateKnowledgeRegistry,
} from ".";
import type { FlavorKnowledgeRegistry, KnowledgeEvidence } from ".";

const idsAreUnique = (values: readonly string[]) => new Set(values).size === values.length;
const registryWith = (values: Partial<FlavorKnowledgeRegistry>): FlavorKnowledgeRegistry => ({
  ...FLAVOR_KNOWLEDGE_REGISTRY,
  ...values,
});
const evidence = (values: Partial<KnowledgeEvidence> = {}): KnowledgeEvidence => ({
  id: "test-evidence", type: "INTERNAL_EXPERT_RULE", sourceName: "test", reference: "one", weight: 0.6, ...values,
});
const profileNote = (noteSlug: string, category: MixProfileNoteResult["category"]): MixProfileNoteResult => ({
  noteIds: [noteSlug], noteName: noteSlug, noteSlug, category, contributionScore: 10, sharePercent: 25, sources: [],
});
const appliedRuleIds = (left: MixProfileNoteResult, right: MixProfileNoteResult) =>
  analyzeNoteCompatibility([left, right]).appliedRules.map(item => item.ruleId);

describe("Flavor Knowledge taxonomy", () => {
  it("1. all category IDs are unique", () => expect(idsAreUnique(FLAVOR_KNOWLEDGE_REGISTRY.categories.map(item => item.id))).toBe(true));
  it("2. all required stable categories are present", () => expect(FLAVOR_KNOWLEDGE_REGISTRY.categories.map(item => item.id).sort()).toEqual([...FLAVOR_NOTE_CATEGORIES].sort()));
  it("3. every parent category exists", () => expect(FLAVOR_KNOWLEDGE_REGISTRY.categories.every(item => !item.parentId || getCategoryDefinition(item.parentId))).toBe(true));
  it("4. every related category exists", () => expect(FLAVOR_KNOWLEDGE_REGISTRY.categories.every(item => item.relatedCategoryIds.every(id => getCategoryDefinition(id)))).toBe(true));
  it("5. parent hierarchy has no cycles", () => expect(validateKnowledgeRegistry(FLAVOR_KNOWLEDGE_REGISTRY).errors.some(item => item.includes("Cyclic"))).toBe(false));
  it("6. BERRY is a child of FRUIT", () => expect(isParentCategory("FRUIT", "BERRY")).toBe(true));
  it("7. CITRUS is related to FRUIT", () => expect(areRelatedCategories("CITRUS", "FRUIT")).toBe(true));
  it("8. COFFEE belongs to BEVERAGE", () => expect(getParentCategory("COFFEE")?.id).toBe("BEVERAGE"));
  it("9. MINT belongs to HERBAL", () => expect(getParentCategory("MINT")?.id).toBe("HERBAL"));
  it("10. child query is stable", () => expect(getChildCategories("FRUIT").map(item => item.id)).toEqual(["BERRY", "CITRUS", "TROPICAL"]));
  it("11. related query includes reverse links", () => expect(getRelatedCategories("BERRY").map(item => item.id)).toContain("FLORAL"));
  it("12. same-category query is explicit", () => expect(isSameCategory("COFFEE", "COFFEE")).toBe(true));
  it("13. legacy DRINK maps to BEVERAGE", () => expect(toKnowledgeCategory("DRINK")).toBe("BEVERAGE"));
  it("14. legacy DAIRY maps to CREAMY", () => expect(toKnowledgeCategory("DAIRY")).toBe("CREAMY"));
  it("15. legacy OTHER has no invented canonical category", () => expect(toKnowledgeCategory("OTHER")).toBeUndefined());
  it("16. ADR-018: knowledge BEVERAGE maps back to legacy DRINK", () => expect(toLegacyCategory("BEVERAGE")).toBe("DRINK"));
  it("17. ADR-018: knowledge CREAMY maps back to legacy DAIRY", () => expect(toLegacyCategory("CREAMY")).toBe("DAIRY"));
  it("18. ADR-018: identity-named categories round-trip in both directions", () => {
    for (const category of ["SOUR", "CANDY", "MINT", "TEA", "FRESH", "BAKERY", "ALCOHOL", "WOODY", "VANILLA"] as const) {
      expect(toLegacyCategory(category)).toBe(category);
      expect(toKnowledgeCategory(category)).toBe(category);
    }
  });
  it("19. ADR-018: TOBACCO has no legacy equivalent (unused by the registry, not added to the Prisma enum)", () => expect(toLegacyCategory("TOBACCO")).toBeUndefined());
});

describe("Flavor Knowledge category relations", () => {
  it("16. BERRY + FLORAL is GOOD_MATCH", () => expect(getCategoryRelation("BERRY", "FLORAL").type).toBe("GOOD_MATCH"));
  it("17. relation lookup is symmetric", () => expect(getCategoryRelation("FLORAL", "BERRY")).toEqual(getCategoryRelation("BERRY", "FLORAL")));
  it("18. DESSERT + CREAMY is STRONG_MATCH", () => expect(getCategoryRelation("DESSERT", "CREAMY").type).toBe("STRONG_MATCH"));
  it("19. COFFEE + CITRUS is RISKY", () => expect(getCategoryRelation("COFFEE", "CITRUS").type).toBe("RISKY"));
  it("20. CANDY + SMOKY is CONFLICT", () => expect(getCategoryRelation("CANDY", "SMOKY").type).toBe("CONFLICT"));
  it("21. an unknown pair is NEUTRAL", () => expect(getCategoryRelation("ALCOHOL", "SMOKY").type).toBe("NEUTRAL"));
  it("22. pair order does not affect score", () => expect(getCategoryRelationScore("TEA", "CITRUS")).toBe(getCategoryRelationScore("CITRUS", "TEA")));
  it("23. every baseScore is between -1 and 1", () => expect(FLAVOR_KNOWLEDGE_REGISTRY.categoryRelations.every(item => item.baseScore >= -1 && item.baseScore <= 1)).toBe(true));
  it("24. every relation ruleId is unique", () => expect(idsAreUnique(FLAVOR_KNOWLEDGE_REGISTRY.categoryRelations.map(item => item.ruleId))).toBe(true));
  it("25. creamy and sour keep conditional metadata", () => expect(getCategoryRelation("CREAMY", "SOUR").metadata?.conditionalContrastAtModerateAcidity).toBe(true));
  it("62. ADR-019: FLORAL + CREAMY is now COMPLEMENTARY_CONTRAST (was NEUTRAL/no relation)", () => expect(getCategoryRelation("FLORAL", "CREAMY").type).toBe("COMPLEMENTARY_CONTRAST"));
  it("63. ADR-019 review resolution: MINT+CREAMY and VANILLA+COFFEE were reviewed and explicitly KEPT UNCHANGED (sign-flip proposals rejected)", () => {
    expect(getCategoryRelation("MINT", "CREAMY")).toMatchObject({ type: "RISKY", baseScore: -0.5, ruleId: "category.mint-creamy" });
    expect(getCategoryRelation("VANILLA", "COFFEE")).toMatchObject({ type: "GOOD_MATCH", baseScore: 0.4, ruleId: "category.vanilla-coffee" });
  });
  it("69. ADR-019 review resolution: TEA+CITRUS and BERRY+CREAMY (DAIRY+BERRY) upgraded to STRONG_MATCH per explicit decision", () => {
    expect(getCategoryRelation("TEA", "CITRUS")).toMatchObject({ type: "STRONG_MATCH", baseScore: 0.7, ruleId: "category.tea-citrus" });
    expect(getCategoryRelation("BERRY", "CREAMY")).toMatchObject({ type: "STRONG_MATCH", baseScore: 0.7, ruleId: "category.berry-creamy" });
  });
  it("70. ADR-019 review resolution: SPICE+TEA downgraded from unconditional GOOD_MATCH to COMPLEMENTARY_CONTRAST per explicit decision", () => expect(getCategoryRelation("SPICE", "TEA")).toMatchObject({ type: "COMPLEMENTARY_CONTRAST", baseScore: 0.25, ruleId: "category.spice-tea" }));
  it("71. ADR-019 review resolution: the 3 revised pairs now use aggregated-research evidence, not the original internal-expert-rule evidence", () => {
    expect(getCategoryRelation("TEA", "CITRUS").evidenceIds).toEqual(["evidence.aggregated-research.high"]);
    expect(getCategoryRelation("BERRY", "CREAMY").evidenceIds).toEqual(["evidence.aggregated-research.high"]);
    expect(getCategoryRelation("SPICE", "TEA").evidenceIds).toEqual(["evidence.aggregated-research.high"]);
  });
  it("72. ADR-019 review resolution: DESSERT+CREAMY keeps its original STRONG_MATCH value but now also carries the confirming aggregated-research evidence", () => expect(getCategoryRelation("DESSERT", "CREAMY")).toMatchObject({ type: "STRONG_MATCH", baseScore: 0.7, evidenceIds: ["evidence.internal.rules", "evidence.aggregated-research.high"] }));
  it("73. ADR-019 review resolution: FLORAL+BERRY (the other exact duplicate) was left completely untouched", () => expect(getCategoryRelation("FLORAL", "BERRY")).toMatchObject({ type: "GOOD_MATCH", baseScore: 0.4, evidenceIds: ["evidence.internal.rules"] }));
  it("74. ADR-019 review resolution: the 3 revised pairs are wired via createKnowledgeCategoryRule, so the decision actually affects scoring", () => {
    expect(appliedRuleIds(profileNote("citrus-note", "CITRUS"), profileNote("tea-note", "TEA"))).toContain("category.tea-citrus");
    expect(appliedRuleIds(profileNote("cream", "DAIRY"), profileNote("blueberry", "BERRY"))).toContain("category.berry-creamy");
    expect(appliedRuleIds(profileNote("spice-note", "SPICE"), profileNote("tea-note-2", "TEA"))).toContain("category.spice-tea");
  });
  it("64. ADR-019: CITRUS + SPICE is recorded (not merely defaulted) as an explicit NEUTRAL relation", () => expect(FLAVOR_KNOWLEDGE_REGISTRY.categoryRelations.some(item => item.ruleId === "category.citrus-spice")).toBe(true));
  it("65. ADR-019: createKnowledgeCategoryRule refuses to wire the NEUTRAL CITRUS+SPICE relation", () => expect(() => createKnowledgeCategoryRule("CITRUS", "SPICE")).toThrow());
  it("66. ADR-019 п.2: single-product-marketing evidence has the lowest weight in the entire registry", () => {
    const weights = FLAVOR_KNOWLEDGE_REGISTRY.evidence.map(item => item.weight);
    expect(getEvidence("evidence.aggregated-research.single-product-marketing")?.weight).toBe(Math.min(...weights));
  });
});

describe("Flavor Knowledge notes", () => {
  it("26. blueberry belongs to BERRY", () => expect(getNoteCategories("blueberry")).toContain("BERRY"));
  it("27. lavender belongs to FLORAL", () => expect(getNoteCategories("lavender")).toContain("FLORAL"));
  it("28. alias search is case-insensitive", () => expect(findNoteByAlias("LAVENDER")?.noteId).toBe("lavender"));
  it("29. alias search trims whitespace", () => expect(findNoteByAlias("  лаванда  ")?.noteId).toBe("lavender"));
  it("30. unknown alias returns undefined", () => expect(findNoteByAlias("not-a-note")).toBeUndefined());
  it("31. related notes contain only known IDs", () => expect(FLAVOR_KNOWLEDGE_REGISTRY.notes.every(item => getRelatedNotes(item.noteId).every(related => getNoteKnowledge(related.noteId)))).toBe(true));
  it("32. note relation is symmetric", () => expect(areNotesRelated("blueberry", "lavender")).toBe(areNotesRelated("lavender", "blueberry")));
  it("33. direct note lookup returns canonical data", () => expect(getNoteKnowledge("coffee")?.canonicalName).toBe("Coffee"));
});

describe("Evidence and confidence", () => {
  it("34. evidence weight below zero is rejected", () => expect(validateEvidence(evidence({ weight: -0.1 })).success).toBe(false));
  it("35. evidence weight above one is rejected", () => expect(validateEvidence(evidence({ weight: 1.1 })).success).toBe(false));
  it("36. empty evidence gives confidence zero", () => expect(calculateKnowledgeConfidence([])).toMatchObject({ score: 0, level: "LOW", evidenceCount: 0 }));
  it("37. inferred-only evidence stays LOW", () => expect(calculateKnowledgeConfidence([evidence({ type: "INFERRED_RELATION", weight: 1 })]).level).toBe("LOW"));
  it("38. independent source types increase confidence", () => {
    const one = calculateKnowledgeConfidence([evidence()]);
    const many = calculateKnowledgeConfidence([evidence(), evidence({ id: "two", type: "EDITORIAL_RESEARCH", sourceName: "editor", reference: "two" })]);
    expect(many.score).toBeGreaterThan(one.score);
  });
  it("39. VERIFIED_TEST adds significant confidence", () => {
    const without = calculateKnowledgeConfidence([evidence()]);
    const verified = calculateKnowledgeConfidence([evidence(), evidence({ id: "verified", type: "VERIFIED_TEST", sourceName: "lab", reference: "v1", weight: 0.9 })]);
    expect(verified.score).toBeGreaterThan(without.score);
  });
  it("40. duplicate sources are counted once", () => {
    const duplicate = evidence({ id: "duplicate" });
    expect(calculateKnowledgeConfidence([evidence(), duplicate]).evidenceCount).toBe(1);
  });
  it("41. confidence is always in 0..100", () => expect(calculateKnowledgeConfidence([evidence({ type: "VERIFIED_TEST", weight: 1 }), evidence({ id: "two", type: "EDITORIAL_RESEARCH", sourceName: "two", reference: "two", weight: 1 })]).score).toBeLessThanOrEqual(100));
  it("42. confidence is deterministic", () => {
    const input = [evidence(), evidence({ id: "two", type: "VERIFIED_TEST", sourceName: "two", reference: "two" })];
    expect(calculateKnowledgeConfidence(input)).toEqual(calculateKnowledgeConfidence(input));
  });
  it("43. confidence does not mutate evidence", () => {
    const input = [evidence()]; const snapshot = structuredClone(input); calculateKnowledgeConfidence(input); expect(input).toEqual(snapshot);
  });
  it("44. evidence query returns registered evidence", () => expect(getEvidence("evidence.internal.rules")?.type).toBe("INTERNAL_EXPERT_RULE"));
});

describe("Claims and registry validation", () => {
  it("45. claim with unknown evidence is rejected", () => {
    const claims = [{ ...FLAVOR_KNOWLEDGE_REGISTRY.claims[0], id: "bad", evidenceIds: ["missing"] }];
    expect(validateKnowledgeRegistry(registryWith({ claims })).success).toBe(false);
  });
  it("46. claim with empty subjectIds is rejected", () => {
    const claims = [{ ...FLAVOR_KNOWLEDGE_REGISTRY.claims[0], id: "bad", subjectIds: [] }];
    expect(validateKnowledgeRegistry(registryWith({ claims })).success).toBe(false);
  });
  it("47. claim IDs are unique", () => expect(idsAreUnique(FLAVOR_KNOWLEDGE_REGISTRY.claims.map(item => item.id))).toBe(true));
  it("48. confidence-for-claim uses claim evidence", () => expect(calculateKnowledgeConfidenceForClaim("claim.relation.coffee-creamy").evidenceCount).toBe(3));
  it("49. subject claim query has stable order", () => {
    const ids = getClaimsForSubject("COFFEE").map(item => item.id); expect(ids).toEqual([...ids].sort());
  });
  it("50. direct claim lookup works", () => expect(getClaim("claim.note.lavender-category")?.value).toBe("FLORAL"));
  it("51. default registry passes full validation", () => expect(validateKnowledgeRegistry(FLAVOR_KNOWLEDGE_REGISTRY)).toEqual({ success: true, errors: [] }));
  it("52. duplicate IDs are detected", () => {
    const categories = [...FLAVOR_KNOWLEDGE_REGISTRY.categories, FLAVOR_KNOWLEDGE_REGISTRY.categories[0]];
    expect(validateKnowledgeRegistry(registryWith({ categories })).errors.some(item => item.includes("Duplicate category"))).toBe(true);
  });
  it("53. broken references are detected", () => {
    const notes = [{ ...FLAVOR_KNOWLEDGE_REGISTRY.notes[0], relatedNoteIds: ["missing"] }, ...FLAVOR_KNOWLEDGE_REGISTRY.notes.slice(1)];
    expect(validateKnowledgeRegistry(registryWith({ notes })).errors.some(item => item.includes("Unknown related note"))).toBe(true);
  });
  it("54. input array order does not change queries", () => {
    const reversed = registryWith({ categories: [...FLAVOR_KNOWLEDGE_REGISTRY.categories].reverse(), categoryRelations: [...FLAVOR_KNOWLEDGE_REGISTRY.categoryRelations].reverse(), notes: [...FLAVOR_KNOWLEDGE_REGISTRY.notes].reverse(), claims: [...FLAVOR_KNOWLEDGE_REGISTRY.claims].reverse() });
    expect(getCategoryRelation("BERRY", "FLORAL", reversed)).toEqual(getCategoryRelation("BERRY", "FLORAL"));
    expect(getRelatedNotes("coffee", reversed)).toEqual(getRelatedNotes("coffee"));
    expect(getClaimsForSubject("COFFEE", reversed)).toEqual(getClaimsForSubject("COFFEE"));
  });
  it("55. public queries do not mutate registry", () => {
    const snapshot = JSON.stringify(FLAVOR_KNOWLEDGE_REGISTRY); getRelatedCategories("FRUIT"); getRelatedNotes("coffee"); getClaimsForSubject("COFFEE"); expect(JSON.stringify(FLAVOR_KNOWLEDGE_REGISTRY)).toBe(snapshot);
  });
  it("56. default registry is deeply frozen", () => expect(Object.isFrozen(FLAVOR_KNOWLEDGE_REGISTRY.notes[0].aliases)).toBe(true));
});

describe("Compatibility Engine integration", () => {
  it("57. legacy COFFEE + DAIRY maps to STRONG_MATCH knowledge", () => expect(getKnowledgeRelationForLegacyCategories("COFFEE", "DAIRY")?.type).toBe("STRONG_MATCH"));
  it("58. Coffee + Cream keeps the existing positive rule", () => expect(appliedRuleIds(profileNote("coffee", "COFFEE"), profileNote("cream", "DAIRY"))).toContain("note.coffee-dairy"));
  it("59. Coffee + Citrus receives the Knowledge Layer risk", () => expect(appliedRuleIds(profileNote("coffee", "COFFEE"), profileNote("lemon", "CITRUS"))).toContain("category.coffee-citrus"));
  it("60. Berry + Floral receives the Knowledge Layer positive rule", () => expect(appliedRuleIds(profileNote("blueberry", "BERRY"), profileNote("lavender", "FLORAL"))).toContain("category.berry-floral"));
  it("61. repeated compatibility analysis is deterministic", () => {
    const notes = [profileNote("coffee", "COFFEE"), profileNote("lemon", "CITRUS")]; expect(analyzeNoteCompatibility(notes)).toEqual(analyzeNoteCompatibility(notes));
  });
  it("67. ADR-019: Sarma (FLORAL) + Daily Hookah Сливки (DAIRY) now receives the new Knowledge Layer rule", () => expect(appliedRuleIds(profileNote("lavender", "FLORAL"), profileNote("cream", "DAIRY"))).toContain("category.floral-creamy"));
  it("68. ADR-019: a single-product-marketing-sourced RISKY rule still applies (Coffee + Berry)", () => expect(appliedRuleIds(profileNote("coffee", "COFFEE"), profileNote("blueberry", "BERRY"))).toContain("category.coffee-berry"));
});
