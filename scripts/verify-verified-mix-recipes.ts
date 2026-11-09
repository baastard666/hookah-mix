import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { importExpertMixKnowledge } from "../src/lib/expert-mix-knowledge-import";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../src/lib/tobacco-identity-decisions";
import { applyIdentityDecisionsToExpertMixKnowledge, auditPublicVerifiedMixRecipes, createVerifiedMixRecipeRegistry, mapVerifiedMixRecipeToPublic } from "../src/lib/verified-mix-recipe";

const sha256 = async (filePath: string): Promise<string> => createHash("sha256").update(await readFile(filePath)).digest("hex").toUpperCase();

const markdown = (report: ReturnType<typeof createVerifiedMixRecipeRegistry>["audit"], workbook: { readonly sha256Before: string; readonly sha256After: string; readonly sizeBefore: number; readonly sizeAfter: number }): string => {
  const skipReasons = Object.entries(report.skipReasons).filter(([, count]) => count > 0).map(([code, count]) => `- \`${code}\`: ${count}`).join("\n") || "- Нет";
  return [
    "# Аудит Verified Mix Recipe Registry", "", "## Workbook",
    `- SHA-256 до/после: \`${workbook.sha256Before}\` / \`${workbook.sha256After}\``,
    `- Размер до/после: ${workbook.sizeBefore} / ${workbook.sizeAfter} байт`, "", "## Набор знаний",
    `- Всего ExpertMixKnowledge: ${report.records.total}`,
    `- MIX: ${report.records.mixes}; SINGLE_PRODUCT_SESSION: ${report.records.singleProductSessions}`,
    `- VERIFIED MIX-кандидатов: ${report.verifiedMixCandidates}`,
    `- Eligible recipes: ${report.eligibleRecipes}; skipped: ${report.skippedRecipes}`,
    `- Компонентов в recipes: ${report.totalRecipeComponents}; уникальных canonical products: ${report.uniqueCanonicalProducts}`,
    "", "## Причины пропуска", skipReasons, "", "## Проверка данных",
    `- proportionsConfirmed: ${report.proportionsConfirmed}`,
    `- independentEvidenceCount > 0: ${report.recipesWithIndependentEvidence}`,
    `- internal test evidence: ${report.recipesWithInternalTestEvidence}`,
    `- observed reaction evidence: ${report.recipesWithObservedReactionEvidence}`,
    `- preparation: ${report.recipesWithPreparation}; evaluation: ${report.recipesWithEvaluation}`,
    `- numeric rating: ${report.recipesWithNumericRating}; qualitative-only verdict: ${report.recipesWithQualitativeOnlyVerdict}`,
    "", "## Контроль", `- validation issues: ${report.validationIssues.length}`, `- privacy issues: ${report.privacyIssues.length}`, "",
  ].join("\n");
};

const main = async (): Promise<void> => {
  const workbookPath = path.resolve(process.argv[2] ?? "data/hookah_mix_database.xlsx");
  const sha256Before = await sha256(workbookPath);
  const sizeBefore = (await stat(workbookPath)).size;
  const firstImport = await importExpertMixKnowledge(workbookPath);
  const secondImport = await importExpertMixKnowledge(workbookPath);
  assert.deepEqual(secondImport, firstImport, "Повторный импорт workbook должен быть детерминированным.");

  const enriched = applyIdentityDecisionsToExpertMixKnowledge(firstImport.registry.records, firstImport.components, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const registry = createVerifiedMixRecipeRegistry(enriched, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const repeated = createVerifiedMixRecipeRegistry(enriched, TOBACCO_IDENTITY_DECISION_REGISTRY);
  assert.deepEqual(repeated.list(), registry.list(), "Проекция verified recipes должна быть детерминированной.");
  assert.equal(registry.audit.validationIssues.length, 0, "В registry не должно быть validation issues.");
  assert.deepEqual(auditPublicVerifiedMixRecipes(registry.list().map(mapVerifiedMixRecipeToPublic)), [], "Public recipe output раскрыл внутренние данные.");

  const sha256After = await sha256(workbookPath);
  const sizeAfter = (await stat(workbookPath)).size;
  assert.equal(sha256After, sha256Before, "Исходный workbook был изменён.");
  assert.equal(sizeAfter, sizeBefore, "Размер исходного workbook был изменён.");

  const report = registry.audit;
  const output = { workbook: { sha256Before, sha256After, sizeBefore, sizeAfter, unchanged: true }, ...report, checks: { deterministicImport: true, deterministicRegistry: true, validationPassed: true, publicPrivacyPassed: true } };
  const reportsDirectory = path.resolve("reports");
  await mkdir(reportsDirectory, { recursive: true });
  await writeFile(path.join(reportsDirectory, "verified-mix-recipe-audit.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await writeFile(path.join(reportsDirectory, "verified-mix-recipe-audit.md"), markdown(report, { sha256Before, sha256After, sizeBefore, sizeAfter }), "utf8");
  console.log(JSON.stringify(output, null, 2));
};

main().catch(error => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
