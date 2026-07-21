import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createUnresolvedIdentityReport, importExpertMixKnowledge } from "../src/lib/expert-mix-knowledge-import";
import { createTobaccoIdentityReviewPlan, reviewPlanToCsv, reviewPlanToJson, reviewPlanToMarkdown } from "../src/lib/tobacco-identity-decisions";
import { listManufacturerProfiles, listProductLineProfiles } from "../src/lib/tobacco-profile";

const hash = async (filePath: string) => createHash("sha256").update(await readFile(filePath)).digest("hex").toUpperCase();
const main = async (): Promise<void> => {
  const workbookPath = path.resolve(process.argv[2] ?? "data/hookah_mix_database.xlsx");
  const before = await hash(workbookPath);
  const imported = await importExpertMixKnowledge(workbookPath);
  const unresolved = createUnresolvedIdentityReport({ components: imported.components, catalog: imported.tobacco, mixes: imported.mixes, manufacturers: listManufacturerProfiles(), productLines: listProductLineProfiles() });
  const plan = createTobaccoIdentityReviewPlan(unresolved);
  const outputDirectory = path.resolve("reports"); await mkdir(outputDirectory, { recursive: true });
  const targets = { markdown: path.join(outputDirectory, "tobacco-identity-review-p0-p1.md"), json: path.join(outputDirectory, "tobacco-identity-review-p0-p1.json"), csv: path.join(outputDirectory, "tobacco-identity-review-p0-p1.csv") };
  await Promise.all([writeFile(targets.markdown, reviewPlanToMarkdown(plan), "utf8"), writeFile(targets.json, reviewPlanToJson(plan), "utf8"), writeFile(targets.csv, reviewPlanToCsv(plan), "utf8")]);
  const after = await hash(workbookPath); assert.equal(after, before, "Source workbook changed.");
  console.log(JSON.stringify({ workbookPath, sha256Before: before, sha256After: after, workbookUnchanged: true, targets, counts: plan.counts }, null, 2));
};
main().catch(error => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
