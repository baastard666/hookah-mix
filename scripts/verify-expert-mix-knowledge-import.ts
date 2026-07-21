import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { auditImportedKnowledgePrivacy, createSyntheticExpertMixWorkbookBuffer, importExpertMixKnowledge, importExpertMixKnowledgeBuffer, serializeExpertMixImportReport } from "../src/lib/expert-mix-knowledge-import";

const exists = async (filePath: string) => { try { await access(filePath); return true; } catch { return false; } };
const main = async (): Promise<void> => {
const requestedPath = process.argv[2]; const defaultPath = path.resolve("hookah_mix_database_v2.xlsx"); const workbookPath = requestedPath ? path.resolve(requestedPath) : defaultPath;
const useRealWorkbook = await exists(workbookPath);
const beforeHash = useRealWorkbook ? createHash("sha256").update(await readFile(workbookPath)).digest("hex") : null;
const result = useRealWorkbook ? await importExpertMixKnowledge(workbookPath) : await importExpertMixKnowledgeBuffer(await createSyntheticExpertMixWorkbookBuffer(), "<memory>/synthetic-expert-mix-import.xlsx");

assert.ok(result.inspection.sheetsFound.includes("ОСНОВНАЯ_БАЗА"), "primary tobacco sheet missing");
assert.ok(result.inspection.sheetsFound.includes("Mixes_Internal"), "mix sheet missing");
assert.ok(result.inspection.sheetsFound.includes("Mix_Components"), "component sheet missing");
assert.ok(result.inspection.sheets.every(sheet => Array.isArray(sheet.headers)), "headers were not inspected");
assert.ok(result.tobacco.length > 0, "tobacco staging is empty");
assert.ok(result.components.length > 0, "component staging is empty");
assert.ok(result.tobacco.some(item => item.identityStatus !== "RESOLVED"), "fixture must preserve non-resolved identity");
if (!useRealWorkbook) {
  const dogma = result.tobacco.find(item => item.manufacturer === "Dogma"); const nash = result.tobacco.find(item => item.manufacturer === "НАШ");
  assert.equal(dogma?.manufacturerId, "dogma"); assert.equal(nash?.manufacturerId, "nash"); assert.notEqual(dogma?.canonicalProductId, nash?.canonicalProductId);
  assert.ok(result.tobacco.some(item => item.observations.some(observation => observation.sourceType === "SOURCE_STATED")));
  assert.ok(result.tobacco.some(item => item.externalRatings.length > 0));
  assert.ok(result.tobacco.flatMap(item => item.derivedCharacteristics).filter(item => item.kind === "TAG_CATEGORY").every(item => typeof item.value === "string"));
  assert.ok(result.report.issues.some(issue => issue.code === "PRELIMINARY_VALUE_WITHOUT_LOW_CONFIDENCE"));
  assert.ok(result.report.validation.weightSumWarnings > 0);
}
assert.deepEqual(auditImportedKnowledgePrivacy(result.publicRecords), []);
assert.ok(Object.isFrozen(result.registry)); assert.ok(Object.isFrozen(result.registry.records)); assert.ok(Object.isFrozen(result.registry.report.issues));
assert.doesNotThrow(() => JSON.parse(serializeExpertMixImportReport(result.report)));
const repeated = useRealWorkbook ? await importExpertMixKnowledge(workbookPath) : await importExpertMixKnowledgeBuffer(await createSyntheticExpertMixWorkbookBuffer(), "<memory>/synthetic-expert-mix-import.xlsx");
assert.deepEqual(result, repeated, "import must be deterministic");
if (useRealWorkbook) assert.equal(createHash("sha256").update(await readFile(workbookPath)).digest("hex"), beforeHash, "source workbook changed");

console.log(JSON.stringify({ mode: useRealWorkbook ? "real-workbook" : "synthetic-fixture", workbookPath: useRealWorkbook ? workbookPath : null, sourceWorkbookUnchanged: true, report: result.report }, null, 2));
};
main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
