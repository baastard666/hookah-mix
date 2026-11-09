import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { importExpertMixKnowledge } from "../src/lib/expert-mix-knowledge-import";
import { applyIdentityDecisionsToExpertMixKnowledge, createVerifiedMixRecipeRegistry } from "../src/lib/verified-mix-recipe";
import { buildCanonicalMixInputFromVerifiedRecipe, calculateVerifiedRecipeAnalysis, createVerifiedMixAnalysisAudit } from "../src/lib/verified-mix-analysis";
import type { VerifiedMixAnalysisAuditRecord } from "../src/lib/verified-mix-analysis";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../src/lib/tobacco-identity-decisions";

const sha256 = async (filePath: string): Promise<string> => createHash("sha256").update(await readFile(filePath)).digest("hex").toUpperCase();
const distribution = (name: string, values: { readonly min: number | null; readonly max: number | null; readonly mean: number | null; readonly median: number | null; readonly p25: number | null; readonly p75: number | null }): string =>
  `- ${name}: min ${values.min}; max ${values.max}; mean ${values.mean}; median ${values.median}; p25 ${values.p25}; p75 ${values.p75}`;
const choose = (items: readonly VerifiedMixAnalysisAuditRecord[], fallback: VerifiedMixAnalysisAuditRecord | undefined): readonly string[] =>
  items.length ? [items[0].recipeId] : fallback ? [fallback.recipeId] : [];

const main = async (): Promise<void> => {
  const workbookPath = path.resolve(process.argv[2] ?? "data/hookah_mix_database.xlsx");
  const sha256Before = await sha256(workbookPath);
  const sizeBefore = (await stat(workbookPath)).size;
  const firstImport = await importExpertMixKnowledge(workbookPath);
  const secondImport = await importExpertMixKnowledge(workbookPath);
  assert.deepEqual(secondImport, firstImport, "Повторный импорт workbook должен быть детерминированным.");
  const records = applyIdentityDecisionsToExpertMixKnowledge(firstImport.registry.records, firstImport.components, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const recipes = createVerifiedMixRecipeRegistry(records, TOBACCO_IDENTITY_DECISION_REGISTRY).list();
  const audit = createVerifiedMixAnalysisAudit(recipes);
  assert.equal(audit.failures.length, 0, "Каждый eligible recipe должен анализироваться без ошибки.");
  assert.equal(audit.recipesAnalyzed, recipes.length, "Audit обязан охватить все eligible recipes.");
  assert.deepEqual(audit.privacyIssues, [], "Public recipe analysis не должен раскрывать private provenance.");
  for (const recipe of recipes) {
    const inputs = buildCanonicalMixInputFromVerifiedRecipe(recipe);
    const result = calculateVerifiedRecipeAnalysis(recipe);
    assert.deepEqual(calculateVerifiedRecipeAnalysis(recipe), result, `Recipe ${recipe.recipeId} должен быть детерминированным.`);
    assert.equal(result.observed.smokeScore, null, `Recipe ${recipe.recipeId} не должен получать synthetic smoke score.`);
    assert.equal(recipe.verification.proportionsConfirmed, false, `Recipe ${recipe.recipeId} не должен получать synthetic proportion confirmation.`);
    assert.equal(recipe.verification.independentEvidenceCount, 0, `Recipe ${recipe.recipeId} не должен получать synthetic independent evidence.`);
    assert.ok(Math.abs(result.components.reduce((sum, component) => sum + component.percentage, 0) - 100) <= 0.0001, `Recipe ${recipe.recipeId} должен сохранять сумму 100%.`);
    assert.ok(Number.isFinite(result.predicted.qualityScore), `Recipe ${recipe.recipeId} не должен создавать NaN score.`);
    assert.ok(inputs.every(input => input.sourceProfileAvailable === false && input.profileCandidates?.every(candidate => candidate.type === "CANONICAL_PRODUCT_PROFILE")), `Recipe ${recipe.recipeId} не должен использовать Prisma/source profile.`);
    result.coverage.nullProfileDimensions.forEach(field => assert.equal(result.analysis.mixProfile.profile[field], null, `Recipe ${recipe.recipeId} не должен превращать null ${field} в fabricated value.`));
  }
  const ordered = audit.records;
  const first = ordered[0];
  const references = {
    twoComponents: choose(ordered.filter(item => item.componentCount === 2), first),
    threeComponents: choose(ordered.filter(item => item.componentCount === 3), first),
    maxComponents: ordered.length ? [ordered.reduce((best, item) => item.componentCount > best.componentCount ? item : best).recipeId] : [],
    sweetDessert: choose(ordered.filter(item => item.dominantCategories.some(category => category === "DESSERT" || category === "CREAMY" || category === "VANILLA" || category === "CANDY")), first),
    sourFruity: choose(ordered.filter(item => item.dominantCategories.some(category => category === "SOUR" || category === "FRUIT" || category === "BERRY" || category === "CITRUS" || category === "TROPICAL")), first),
    unusualCategories: choose(ordered.filter(item => item.dominantCategories.some(category => category === "ALCOHOL" || category === "SMOKY" || category === "WOODY" || category === "TEA")), first),
    highestScore: ordered.length ? [ordered.reduce((best, item) => item.predictedQualityScore > best.predictedQualityScore ? item : best).recipeId] : [],
    lowestScore: ordered.length ? [ordered.reduce((best, item) => item.predictedQualityScore < best.predictedQualityScore ? item : best).recipeId] : [],
    highestConfidence: ordered.length ? [ordered.reduce((best, item) => item.predictionConfidenceScore > best.predictionConfidenceScore ? item : best).recipeId] : [],
    lowestConfidence: ordered.length ? [ordered.reduce((best, item) => item.predictionConfidenceScore < best.predictionConfidenceScore ? item : best).recipeId] : [],
  };
  const sha256After = await sha256(workbookPath);
  const sizeAfter = (await stat(workbookPath)).size;
  assert.equal(sha256After, sha256Before, "Исходный workbook был изменён.");
  assert.equal(sizeAfter, sizeBefore, "Размер исходного workbook был изменён.");
  const output = { workbook: { sha256Before, sha256After, sizeBefore, sizeAfter, unchanged: true }, audit, references, checks: { deterministicImport: true, allEligibleRecipesAnalyzed: true, predictedOnly: true, publicPrivacyPassed: true, workbookUnchanged: true } };
  const markdown = [
    "# Аудит Mix Analysis v2 для Verified Mix Recipes", "", "## Workbook",
    `- SHA-256 до/после: \`${sha256Before}\` / \`${sha256After}\``, `- Размер до/после: ${sizeBefore} / ${sizeAfter} байт`, "",
    "## Рецепты", `- Проанализировано: ${audit.recipesAnalyzed}; ошибок: ${audit.failures.length}`, `- Компонентов: ${audit.totalComponents}; coverage Product Flavor Profile: ${audit.productProfileCoverage}%`, `- fallback-компонентов: ${audit.fallbackComponents}; рецептов с fallback: ${audit.recipesWithFallback}`, "",
    "## Распределения", distribution("predictedQualityScore", audit.predictedQualityScore), distribution("predictionConfidenceScore", audit.predictionConfidenceScore), distribution("dataQuality", audit.dataQuality), distribution("compatibilityScore", audit.compatibilityScore), distribution("riskScore", audit.riskScore), `- Одинаковые predicted scores: ${audit.duplicatePredictedScores.map(item => `${item.score} × ${item.count}`).join(", ") || "нет"}`, `- В пределах ±0.2 от медианы: ${audit.withinPointTwoOfMedian}`, "",
    "## Recommendations", `- С рекомендациями: ${audit.recommendations.withRecommendations}; accepted variants: ${audit.recommendations.acceptedVariants}; без изменений: ${audit.recommendations.unchanged}; rejected proposals: ${audit.recommendations.rejectedProposals}`, "",
    "## Честность данных", "- proportionsConfirmed: 0; independentEvidenceCount > 0: 0; verifiedSmokeScore: 0.", "- VERIFIED recipe остаётся predicted-only и не создаёт synthetic evidence.", `- Privacy issues: ${audit.privacyIssues.length}`, "",
    "## Диагностические recipeId", ...Object.entries(references).map(([key, value]) => `- ${key}: ${value.join(", ") || "нет"}`), "",
  ].join("\n");
  const reportsDirectory = path.resolve("reports");
  await mkdir(reportsDirectory, { recursive: true });
  await writeFile(path.join(reportsDirectory, "verified-mix-analysis-audit.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await writeFile(path.join(reportsDirectory, "verified-mix-analysis-audit.md"), markdown, "utf8");
  console.log(JSON.stringify(output, null, 2));
};

main().catch(error => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
