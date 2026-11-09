import { describe, expect, it } from "vitest";
import { adaptExternalExpertMixInput } from "../expert-mix-knowledge";
import type { ExpertMixKnowledgeRecord, ExternalExpertMixInput } from "../expert-mix-knowledge";
import { createDecisionFixture, createTobaccoIdentityDecisionRegistry } from "../tobacco-identity-decisions";
import type { NormalizedMixComponentStagingRecord } from "../expert-mix-knowledge-import";
import {
  applyIdentityDecisionsToExpertMixKnowledge,
  auditPublicVerifiedMixRecipes,
  createVerifiedMixRecipeRegistry,
  evaluateVerifiedMixRecipeEligibility,
  findVerifiedMixRecipesContainingProducts,
  mapVerifiedMixRecipeToPublic,
} from "./index";

const alpha = createDecisionFixture({ id: "decision-alpha", manufacturer: "Brand A", manufacturerId: "brand-a", productName: "Alpha" });
const beta = createDecisionFixture({ id: "decision-beta", manufacturer: "Brand B", manufacturerId: "brand-b", productName: "Beta" });
const gamma = createDecisionFixture({ id: "decision-gamma", manufacturer: "Brand C", manufacturerId: "brand-c", productName: "Gamma" });
const decisionRegistry = createTobaccoIdentityDecisionRegistry([alpha, beta, gamma]);
const alphaId = alpha.decision.canonicalProductId!;
const betaId = beta.decision.canonicalProductId!;
const gammaId = gamma.decision.canonicalProductId!;

type ComponentOverride = Partial<NonNullable<ExternalExpertMixInput["components"]>[number]>;
const component = (name: string, canonicalProductId: string, position: number, percentage: number, override: ComponentOverride = {}) => ({
  componentId: `${name}-${position}`,
  position,
  rawProductName: name,
  canonicalProductId,
  canonicalProductName: name,
  manufacturerId: `manufacturer-${name.toLowerCase()}`,
  identityStatus: "RESOLVED" as const,
  proportion: { type: "PERCENT" as const, value: percentage },
  ...override,
});

const record = (overrides: Partial<ExternalExpertMixInput> = {}): ExpertMixKnowledgeRecord => {
  const input: ExternalExpertMixInput = {
    externalId: "recipe-fixture",
    title: "Проверенный тестовый микс",
    status: "VERIFIED",
    components: [component("Alpha", alphaId, 1, 60, { role: "BASE" }), component("Beta", betaId, 2, 40, { role: "SUPPORT" })],
    proportions: { type: "PERCENT" },
    source: { sourceId: "private-source-identity", sourceType: "INTERNAL_TEST", internalLabel: "private-author", authorVisibility: "INTERNAL_ONLY", url: "https://private.example/recipe" },
    evidence: [],
    observations: [],
    confidence: "HIGH",
    tags: ["Фрукты", "Тест"],
    ...overrides,
  };
  const result = adaptExternalExpertMixInput(input);
  if (!result.valid) throw new Error(result.errors.map(issue => issue.code).join(", "));
  return result.record;
};

describe("Verified Mix Recipe Registry", () => {
  it("принимает VERIFIED MIX с точными RESOLVED-компонентами", () => {
    const source = record();
    const eligibility = evaluateVerifiedMixRecipeEligibility(source, decisionRegistry);
    expect(eligibility.eligible).toBe(true);
    const registry = createVerifiedMixRecipeRegistry([source], decisionRegistry);
    expect(registry.size).toBe(1);
    expect(registry.audit.eligibleRecipes).toBe(1);
    expect(registry.list()[0]?.components.map(component => component.canonicalProductId)).toEqual([alphaId, betaId]);
  });

  it.each(["PARTIALLY_VERIFIED", "DISPUTED", "DRAFT"] as const)("исключает статус %s", status => {
    const eligibility = evaluateVerifiedMixRecipeEligibility(record({ status }), decisionRegistry);
    expect(eligibility.eligible).toBe(false);
    if (!eligibility.eligible) expect(eligibility.issues.some(issue => issue.code === "NOT_VERIFIED")).toBe(true);
  });

  it("исключает одиночную сессию, unresolved, ambiguous и компонент без canonical ID", () => {
    const single = record({ components: [component("Alpha", alphaId, 1, 100)] });
    const unresolved = record({ components: [component("Alpha", alphaId, 1, 60), component("Mystery", "", 2, 40, { identityStatus: "UNRESOLVED", canonicalProductId: undefined, canonicalProductName: undefined })] });
    const ambiguous = record({ components: [component("Alpha", alphaId, 1, 60), component("Mystery", "", 2, 40, { identityStatus: "AMBIGUOUS", canonicalProductId: undefined, canonicalProductName: undefined })] });
    for (const source of [single, unresolved, ambiguous]) expect(evaluateVerifiedMixRecipeEligibility(source, decisionRegistry).eligible).toBe(false);
  });

  it("не превращает PARTS и approximate percent в точный рецепт", () => {
    const parts = record({ proportions: { type: "PARTS", totalParts: 3 }, components: [component("Alpha", alphaId, 1, 2, { proportion: { type: "PARTS", value: 2 } }), component("Beta", betaId, 2, 1, { proportion: { type: "PARTS", value: 1 } })] });
    const approximate = record({ components: [component("Alpha", alphaId, 1, 60, { proportion: { type: "APPROXIMATE_PERCENT", value: 60, tolerance: 1 } }), component("Beta", betaId, 2, 40, { proportion: { type: "APPROXIMATE_PERCENT", value: 40, tolerance: 1 } })] });
    for (const source of [parts, approximate]) expect(evaluateVerifiedMixRecipeEligibility(source, decisionRegistry).eligible).toBe(false);
  });

  it("принимает сумму в существующем epsilon и отвергает mismatch", () => {
    const tolerated = record({ components: [component("Alpha", alphaId, 1, 60.00005), component("Beta", betaId, 2, 40)] });
    expect(evaluateVerifiedMixRecipeEligibility(tolerated, decisionRegistry).eligible).toBe(true);
    const original = record();
    const malformed: ExpertMixKnowledgeRecord = {
      ...original,
      components: original.components.map((component, index) => index === 1 ? { ...component, proportion: { type: "PERCENT", value: 35 } } : component),
    };
    const result = evaluateVerifiedMixRecipeEligibility(malformed, decisionRegistry);
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.issues.some(issue => issue.code === "PERCENT_TOTAL_MISMATCH")).toBe(true);
  });

  it("отвергает повтор canonicalProductId и отсутствующее/не-RESOLVED решение", () => {
    const duplicate = record({ components: [component("Alpha", alphaId, 1, 60), component("Alpha second", alphaId, 2, 40)] });
    const missing = record({ components: [component("Alpha", alphaId, 1, 60), component("Unknown", "not-in-decisions", 2, 40)] });
    for (const source of [duplicate, missing]) expect(evaluateVerifiedMixRecipeEligibility(source, decisionRegistry).eligible).toBe(false);
  });

  it("нормализует рейтинги только для числовых шкал", () => {
    const scale5 = createVerifiedMixRecipeRegistry([record({ evaluation: { verdict: "GOOD", rating: { scale: 5, value: 4 } } })], decisionRegistry).list()[0]!;
    const scale10 = createVerifiedMixRecipeRegistry([record({ evaluation: { verdict: "GOOD", rating: { scale: 10, value: 8 } } })], decisionRegistry).list()[0]!;
    const scale100 = createVerifiedMixRecipeRegistry([record({ evaluation: { verdict: "GOOD", rating: { scale: 100, value: 80 } } })], decisionRegistry).list()[0]!;
    const qualitative = createVerifiedMixRecipeRegistry([record({ evaluation: { verdict: "GOOD", rating: { scale: "QUALITATIVE", value: "GOOD" } } })], decisionRegistry).list()[0]!;
    expect([scale5.evaluation?.numericRating, scale10.evaluation?.numericRating, scale100.evaluation?.numericRating]).toEqual([8, 8, 8]);
    expect(qualitative.evaluation?.numericRating).toBeNull();
    expect(qualitative.evaluation?.qualitativeRating).toBe("GOOD");
  });

  it("не выдумывает confirmations и independent evidence", () => {
    const withOneSourceEvidence = record({ evidence: [
      { evidenceId: "proportion-evidence", type: "PROPORTION_STATEMENT", sourceId: "ignored-by-adapter", confidence: "HIGH", summary: "точные пропорции" },
      { evidenceId: "internal-test-evidence", type: "INTERNAL_TEST_RESULT", sourceId: "ignored-by-adapter", confidence: "HIGH", summary: "внутренний тест" },
    ] });
    const recipe = createVerifiedMixRecipeRegistry([withOneSourceEvidence], decisionRegistry).list()[0]!;
    expect(recipe.verification.proportionsConfirmed).toBe(true);
    expect(recipe.verification.proportionEvidenceCount).toBe(2);
    expect(recipe.verification.independentEvidenceCount).toBe(0);
    expect(recipe.verification.hasInternalTestEvidence).toBe(true);
  });

  it("даёт стабильный ID и порядок независимо от порядка входных записей", () => {
    const first = record({ externalId: "first" });
    const second = record({ externalId: "second", components: [component("Alpha", alphaId, 1, 50), component("Gamma", gammaId, 2, 50)] });
    const left = createVerifiedMixRecipeRegistry([first, second], decisionRegistry).list();
    const right = createVerifiedMixRecipeRegistry([second, first], decisionRegistry).list();
    expect(left).toEqual(right);
  });

  it("предоставляет строгие запросы и не раскрывает изменяемые ссылки", () => {
    const first = record({ externalId: "first" });
    const second = record({ externalId: "second", components: [component("Alpha", alphaId, 1, 50), component("Gamma", gammaId, 2, 50)], tags: ["Другой"] });
    const registry = createVerifiedMixRecipeRegistry([first, second], decisionRegistry);
    const listed = registry.list();
    expect(registry.findByProductId(alphaId)).toHaveLength(2);
    expect(registry.findByTag("фрукты")).toHaveLength(1);
    expect(findVerifiedMixRecipesContainingProducts(registry, [betaId, alphaId, betaId])).toHaveLength(1);
    expect(findVerifiedMixRecipesContainingProducts(registry, [])).toEqual([]);
    expect(Object.isFrozen(listed[0])).toBe(true);
    expect(Object.isFrozen(listed[0]?.components)).toBe(true);
    expect(listed[0]).not.toBe(registry.list()[0]);
  });

  it("public mapper не раскрывает provenance, evidence и пути", () => {
    const source = record({ evidence: [{ evidenceId: "evidence-private-id", type: "DIRECT_STATEMENT", sourceId: "ignored", confidence: "HIGH", excerpt: "private excerpt", summary: "private summary" }] });
    const recipe = createVerifiedMixRecipeRegistry([source], decisionRegistry).list()[0]!;
    const publicRecipe = mapVerifiedMixRecipeToPublic(recipe);
    const serialized = JSON.stringify(publicRecipe);
    expect(serialized).not.toContain("sourceRecordId");
    expect(serialized).not.toContain("private-source-identity");
    expect(serialized).not.toContain("evidence-private-id");
    expect(auditPublicVerifiedMixRecipes([publicRecipe], ["private.example", "private excerpt"])).toEqual([]);
  });

  it("накладывает только точные identity decisions на импортированные knowledge records", () => {
    const source = record({ components: [component("Old Alpha", "legacy-alpha", 1, 60), component("Old Beta", "legacy-beta", 2, 40)] });
    const staged = [
      { componentId: source.components[0]!.componentId, manufacturer: "Brand A", productLine: null, productName: "Alpha" },
      { componentId: source.components[1]!.componentId, manufacturer: "Brand B", productLine: null, productName: "Beta" },
    ] as unknown as readonly NormalizedMixComponentStagingRecord[];
    const applied = applyIdentityDecisionsToExpertMixKnowledge([source], staged, decisionRegistry);
    expect(applied[0]?.components.map(component => component.canonicalProductId)).toEqual([alphaId, betaId]);
    expect(createVerifiedMixRecipeRegistry(applied, decisionRegistry).size).toBe(1);
  });
});
