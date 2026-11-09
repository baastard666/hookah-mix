import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { importExpertMixKnowledge } from "../expert-mix-knowledge-import";
import { PROFILE_CONFIDENCE_RELIABILITY_SCORE } from "../canonical-mix-scoring/constants";
import { FLAVOR_PROFILE_FIELDS } from "../flavors/types";
import { getProductFlavorProfile, listProductFlavorProfiles } from "../product-flavor-profile";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../tobacco-identity-decisions";
import type { VerifiedMixRecipe } from "../verified-mix-recipe";
import { applyIdentityDecisionsToExpertMixKnowledge, createVerifiedMixRecipeRegistry } from "../verified-mix-recipe";
import { buildCanonicalMixInputFromVerifiedRecipe, calculateVerifiedRecipeAnalysis, createVerifiedMixAnalysisAudit } from ".";

const productIds = listProductFlavorProfiles()
  .map(profile => profile.canonicalProductId)
  .filter(id => TOBACCO_IDENTITY_DECISION_REGISTRY.getByCanonicalProductId(id).status === "FOUND");

const recipe = (percentages: readonly number[], sourceStatedRole = false): VerifiedMixRecipe => ({
  recipeId: `test-recipe-${percentages.join("-")}`,
  sourceRecordId: "private-source-record",
  title: "Тестовый рецепт",
  components: percentages.map((percentage, index) => ({
    canonicalProductId: productIds[index], percentage, position: index + 1,
    role: index === 0 ? "BASE" : "SUPPORT",
    roleOrigin: index === 0 && sourceStatedRole ? "SOURCE_STATED" : "DERIVED",
  })),
  totalPercentage: percentages.reduce((sum, percentage) => sum + percentage, 0),
  tags: ["fixture"], confidence: "LOW",
  verification: { proportionsConfirmed: false, proportionEvidenceCount: 0, independentEvidenceCount: 0, hasInternalTestEvidence: false, hasObservedReactionEvidence: false },
  preparation: null, evaluation: null, schemaVersion: "verified-mix-recipe-v1",
});

describe("Verified Mix Analysis", () => {
  it("1. строит canonical input с точной identity и процентами", () => {
    const value = recipe([60, 40]); const input = buildCanonicalMixInputFromVerifiedRecipe(value);
    expect(input.map(item => item.flavorId)).toEqual(value.components.map(item => item.canonicalProductId));
    expect(input.map(item => item.percentage)).toEqual([60, 40]);
    expect(input.every(item => item.identity?.canonicalProductId === item.flavorId)).toBe(true);
  });

  it("2. мапит семь Product Flavor Profile dimensions и sourness в acidity", () => {
    const value = recipe([60, 40]); const input = buildCanonicalMixInputFromVerifiedRecipe(value);
    const source = getProductFlavorProfile(value.components[0].canonicalProductId)!;
    const candidate = input[0].profileCandidates?.[0];
    expect(candidate).toMatchObject({ type: "CANONICAL_PRODUCT_PROFILE", profileId: `canonical:${source.canonicalProductId}`, reliabilityScore: PROFILE_CONFIDENCE_RELIABILITY_SCORE[source.overallConfidence] });
    expect(candidate?.profile.acidity).toBe(source.dimensions.sourness?.value);
    expect(candidate?.profile.sweetness).toBe(source.dimensions.sweetness?.value);
    expect(input[0].sourceProfileAvailable).toBe(false);
  });

  it("3. не подставляет neutral 5 для отсутствующих Product Flavor Profile dimensions", () => {
    const input = buildCanonicalMixInputFromVerifiedRecipe(recipe([60, 40]), { getProductProfile: () => null });
    expect(input[0].profileCandidates).toEqual([]);
    expect(FLAVOR_PROFILE_FIELDS.every(field => input[0].profile[field] === null)).toBe(true);
    expect(input[0].profile.sweetness).not.toBe(5);
  });

  it("4. создаёт категориальные DOMINANT notes, не выдумывая конкретный вкус", () => {
    const value = recipe([60, 40]); const profile = getProductFlavorProfile(value.components[0].canonicalProductId)!;
    const notes = buildCanonicalMixInputFromVerifiedRecipe(value)[0].profileCandidates?.[0].notes ?? [];
    expect(notes.every(note => note.noteName === note.noteName.toUpperCase() && note.noteType === "DOMINANT")).toBe(true);
    expect(notes.map(note => note.noteSlug)).toEqual(profile.dominantNoteIds.flatMap(category => notes.some(note => note.noteSlug === `category:${category.toLowerCase()}`) ? [`category:${category.toLowerCase()}`] : []));
  });

  it("5. анализирует двухкомпонентный рецепт и разделяет predicted и observed", () => {
    const result = calculateVerifiedRecipeAnalysis(recipe([60, 40]));
    expect((result.recipe as { readonly sourceRecordId?: string }).sourceRecordId).toBeUndefined();
    expect(result.components).toHaveLength(2);
    expect(result.observed).toMatchObject({ smokeScore: null, hasObservedEvaluation: false });
    expect(result.predicted.recommendationsArePredictedAlternatives).toBe(true);
    expect(result.analysis.engineVersions.canonicalMixScoring).toBe("canonical-mix-scoring-v1");
  });

  it("6. анализирует трёхкомпонентный рецепт без зависимости от Prisma", () => {
    const result = calculateVerifiedRecipeAnalysis(recipe([40, 35, 25]));
    expect(result.components).toHaveLength(3);
    expect(result.coverage.canonicalIdentityCoverage).toBe(100);
    expect(result.coverage.productProfileCoverage).toBe(100);
    expect(result.flavorSummary.dominantComponentId).toBeTruthy();
  });

  it("7. сохраняет фактические evidence fields и не создаёт verified smoke bonus", () => {
    const value = recipe([60, 40]); const result = calculateVerifiedRecipeAnalysis(value);
    expect(value.verification.proportionsConfirmed).toBe(false);
    expect(value.verification.independentEvidenceCount).toBe(0);
    expect(result.analysis.predictedQualityScore).toBe(result.predicted.qualityScore);
    expect(result.observed.smokeScore).toBeNull();
  });

  it("8. source-stated role остаётся отдельной от inferred role", () => {
    const result = calculateVerifiedRecipeAnalysis(recipe([60, 40], true));
    expect(result.components[0]).toMatchObject({ sourceStatedRole: "BASE", recordedRole: "BASE", roleOrigin: "SOURCE_STATED", inferredRole: null });
    expect(result.components[1].sourceStatedRole).toBeNull();
  });

  it("9. результат детерминирован и не меняет recipe или immutable registries", () => {
    const value = recipe([60, 40]); const before = structuredClone(value); const registryBefore = listProductFlavorProfiles();
    expect(calculateVerifiedRecipeAnalysis(value)).toEqual(calculateVerifiedRecipeAnalysis(value));
    expect(value).toEqual(before);
    expect(listProductFlavorProfiles()).toEqual(registryBefore);
  });

  it("10. public result не раскрывает private provenance", () => {
    const serialized = JSON.stringify(calculateVerifiedRecipeAnalysis(recipe([60, 40])));
    ["sourceRecordId", "evidenceId", "sourceRow", "workbookPath", "privateUrl", "decisionId", "debugReasons"].forEach(token => expect(serialized).not.toContain(token));
  });

  it("11. audit фиксирует coverage, null dimensions и отсутствие synthetic evidence", () => {
    const audit = createVerifiedMixAnalysisAudit([recipe([60, 40]), recipe([40, 35, 25])]);
    expect(audit).toMatchObject({ recipesAnalyzed: 2, failures: [], productProfileCoverage: 100, privacyIssues: [] });
    expect(audit.records.every(item => Math.abs(item.percentages.reduce((sum, value) => sum + value, 0) - 100) <= 0.0001)).toBe(true);
    expect(Object.values(audit.nullDimensionCounts).some(count => count > 0)).toBe(true);
  });

  it("12. два разных canonical products сохраняются раздельными и не объединяются как один компонент", () => {
    const result = calculateVerifiedRecipeAnalysis(recipe([60, 40]));
    expect(new Set(result.components.map(component => component.canonicalProduct.canonicalProductId)).size).toBe(2);
    expect(result.analysis.mixProfile.metadata.componentCount).toBe(2);
  });

  const workbookPath = path.resolve(process.cwd(), "data/hookah_mix_database.xlsx");
  const realWorkbookTest = existsSync(workbookPath) ? it : it.skip;
  realWorkbookTest("13. все eligible recipes real workbook анализируются без исключений", async () => {
    const imported = await importExpertMixKnowledge(workbookPath);
    const records = applyIdentityDecisionsToExpertMixKnowledge(imported.registry.records, imported.components, TOBACCO_IDENTITY_DECISION_REGISTRY);
    const recipes = createVerifiedMixRecipeRegistry(records, TOBACCO_IDENTITY_DECISION_REGISTRY).list();
    expect(recipes).toHaveLength(28);
    expect(() => recipes.forEach(item => calculateVerifiedRecipeAnalysis(item))).not.toThrow();
  });
});
