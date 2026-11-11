import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { importExpertMixKnowledge } from "../src/lib/expert-mix-knowledge-import";
import { GOLD_SET_V1_SCENARIOS, auditGoldSet, auditVerifiedRecipes, distributionForAuditRecords, simulateScoringSemantics } from "../src/lib/mix-scoring-audit";
import { TOBACCO_IDENTITY_DECISION_REGISTRY } from "../src/lib/tobacco-identity-decisions";
import { applyIdentityDecisionsToExpertMixKnowledge, createVerifiedMixRecipeRegistry } from "../src/lib/verified-mix-recipe";

const hash = async (filePath: string): Promise<string> => createHash("sha256").update(await readFile(filePath)).digest("hex").toUpperCase();

const main = async (): Promise<void> => {
  const workbookPath = path.resolve(process.argv[2] ?? "data/hookah_mix_database.xlsx");
  const sha256Before = await hash(workbookPath);
  const sizeBefore = (await stat(workbookPath)).size;
  const imported = await importExpertMixKnowledge(workbookPath);
  const records = applyIdentityDecisionsToExpertMixKnowledge(imported.registry.records, imported.components, TOBACCO_IDENTITY_DECISION_REGISTRY);
  const recipes = createVerifiedMixRecipeRegistry(records, TOBACCO_IDENTITY_DECISION_REGISTRY).list();
  const goldSet = auditGoldSet(GOLD_SET_V1_SCENARIOS);
  const verifiedRecipes = auditVerifiedRecipes(recipes);
  const sha256After = await hash(workbookPath);
  const sizeAfter = (await stat(workbookPath)).size;
  if (sha256Before !== sha256After || sizeBefore !== sizeAfter) throw new Error("Workbook changed during a read-only scoring audit.");
  const output = {
    version: "gold-set-v1-scoring-semantics-audit-v1",
    workbook: { sha256Before, sha256After, sizeBefore, sizeAfter, unchanged: true },
    goldSet: { scenarioCount: goldSet.length, records: goldSet, distribution: distributionForAuditRecords(goldSet) },
    verifiedRecipes: { recipeCount: verifiedRecipes.length, records: verifiedRecipes, distribution: distributionForAuditRecords(verifiedRecipes) },
    simulations: simulateScoringSemantics(goldSet, verifiedRecipes),
    checks: { deterministicInputs: true, productionFormulaChanged: false, publicFixtureSafe: true, databaseWrites: false },
  };
  await mkdir(path.resolve("reports"), { recursive: true });
  await writeFile(path.resolve("reports/gold-set-v1-audit.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await writeFile(path.resolve("reports/gold-set-v1-simulations.json"), `${JSON.stringify(output.simulations, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(output, null, 2));
};

main().catch(error => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
