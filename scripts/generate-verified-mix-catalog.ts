import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { importExpertMixKnowledge } from "../src/lib/expert-mix-knowledge-import";
import { applyIdentityDecisionsToExpertMixKnowledge, createVerifiedMixRecipeRegistry } from "../src/lib/verified-mix-recipe";
import { calculateVerifiedRecipeAnalysis } from "../src/lib/verified-mix-analysis";
import { createVerifiedMixCatalogSnapshot } from "../src/lib/mix-catalog/generator";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../src/lib/tobacco-identity-decisions";

const hash = async (filePath: string): Promise<string> => createHash("sha256").update(await readFile(filePath)).digest("hex").toUpperCase();
const privateTokens = ["sourceRecordId", "sourceId", "evidenceId", "reference", "excerpt", "internalLabel", "author", "workbook", "C:\\", "/Users/", "decisionId", "debugReasons", "category.", "Category relation"];

const main = async (): Promise<void> => {
  const workbook = path.resolve(process.argv[2] ?? "data/hookah_mix_database.xlsx");
  const before = await hash(workbook); const sizeBefore = (await stat(workbook)).size;
  const imported = await importExpertMixKnowledge(workbook);
  const records = applyIdentityDecisionsToExpertMixKnowledge(imported.registry.records, imported.components, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const recipes = createVerifiedMixRecipeRegistry(records, TOBACCO_IDENTITY_DECISION_REGISTRY).list();
  const snapshot = createVerifiedMixCatalogSnapshot(recipes.map(calculateVerifiedRecipeAnalysis));
  const repeated = createVerifiedMixCatalogSnapshot(recipes.map(calculateVerifiedRecipeAnalysis));
  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  assert.equal(serialized, `${JSON.stringify(repeated, null, 2)}\n`, "Generated snapshot должен быть byte-for-byte deterministic.");
  assert.equal(snapshot.items.length, 28, "Snapshot должен содержать 28 eligible recipes.");
  assert.equal(new Set(snapshot.items.map(item => item.recipeId)).size, snapshot.items.length, "recipeId должны быть уникальны.");
  assert.equal(new Set(snapshot.items.map(item => item.slug)).size, snapshot.items.length, "slug должны быть уникальны.");
  assert.deepEqual(privateTokens.filter(token => serialized.includes(token)), [], "Snapshot раскрыл private/internal provenance.");
  snapshot.items.forEach(item => { assert.ok(Number.isFinite(item.predicted.qualityScore)); assert.ok(Math.abs(item.components.reduce((sum, component) => sum + component.percentage, 0) - 100) <= 0.0001); });
  const target = path.resolve("src/data/verified-mix-catalog.generated.json");
  await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, serialized, "utf8");
  const after = await hash(workbook); const sizeAfter = (await stat(workbook)).size;
  assert.equal(before, after, "Workbook был изменён."); assert.equal(sizeBefore, sizeAfter, "Размер workbook был изменён.");
  await mkdir(path.resolve("reports"), { recursive: true });
  await writeFile(path.resolve("reports/verified-mix-catalog-generation-audit.json"), `${JSON.stringify({ sha256Before: before, sha256After: after, sizeBefore, sizeAfter, recipeCount: snapshot.items.length, deterministic: true, privacyIssues: [] }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ recipeCount: snapshot.items.length, schemaVersion: snapshot.schemaVersion, snapshotPath: "src/data/verified-mix-catalog.generated.json", workbookUnchanged: true }, null, 2));
};
main().catch(error => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
