import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCanonicalMixScoringAudit } from "../src/lib/canonical-mix-scoring/workbook-audit";
import { importExpertMixKnowledge } from "../src/lib/expert-mix-knowledge-import";

const hash = async (filePath: string): Promise<string> => createHash("sha256").update(await readFile(filePath)).digest("hex").toUpperCase();
const main = async (): Promise<void> => {
  const workbookPath = path.resolve(process.argv[2] ?? "data/hookah_mix_database.xlsx"); const before = await hash(workbookPath);
  const first = await importExpertMixKnowledge(workbookPath); const second = await importExpertMixKnowledge(workbookPath); assert.deepEqual(second, first, "Repeated workbook import must be deterministic.");
  const report = createCanonicalMixScoringAudit(first);
  assert.equal(report.processedMixes, first.mixes.filter(mix => mix.status === "VERIFIED").length); assert.equal(report.sourceComponents, first.components.filter(component => first.mixes.some(mix => mix.mixId === component.mixId && mix.status === "VERIFIED")).length);
  assert.equal(report.scoringErrors.length, 0); assert.equal(report.sumPreservationErrors.length, 0); assert.equal(report.componentPreservationErrors.length, 0); assert.equal(report.privacyViolations.length, 0);
  assert.equal(report.resolutionCounts.RESOLVED + report.resolutionCounts.MANUFACTURER_ONLY + report.resolutionCounts.AMBIGUOUS + report.resolutionCounts.UNRESOLVED, report.sourceComponents);
  assert.ok(report.scoreDistribution.min >= 0 && report.scoreDistribution.max <= 10); assert.equal(report.verifiedSmokeScores, 0); assert.equal(report.purelyPredictedScores, report.processedMixes);
  const after = await hash(workbookPath); assert.equal(after, before, "Source workbook changed.");
  await mkdir(path.resolve("reports"), { recursive: true }); const target = path.resolve("reports/v0.3.3-canonical-mix-scoring-audit.json"); await writeFile(target, `${JSON.stringify({ workbookSha256: before, workbookUnchanged: true, ...report }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ workbookSha256Before: before, workbookSha256After: after, workbookUnchanged: true, reportPath: target, ...report }, null, 2));
};
main().catch(error => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
