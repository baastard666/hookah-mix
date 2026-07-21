import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import {
  auditImportedKnowledgePrivacy,
  createSyntheticExpertMixWorkbookBuffer,
  importExpertMixKnowledge,
  importExpertMixKnowledgeBuffer,
  serializeExpertMixImportReport,
} from "../src/lib/expert-mix-knowledge-import";

const exists = async (filePath: string) => { try { await access(filePath); return true; } catch { return false; } };
const text = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;

const main = async (): Promise<void> => {
  const requestedPath = process.argv[2];
  const defaultPath = path.resolve("hookah_mix_database_v2.xlsx");
  const workbookPath = requestedPath ? path.resolve(requestedPath) : defaultPath;
  const useRealWorkbook = await exists(workbookPath);
  const beforeHash = useRealWorkbook ? createHash("sha256").update(await readFile(workbookPath)).digest("hex") : null;
  const result = useRealWorkbook
    ? await importExpertMixKnowledge(workbookPath)
    : await importExpertMixKnowledgeBuffer(await createSyntheticExpertMixWorkbookBuffer(), "<memory>/synthetic-expert-mix-import.xlsx");

  assert.ok(result.inspection.sheetsFound.includes("ОСНОВНАЯ_БАЗА"), "primary tobacco sheet missing");
  assert.ok(result.inspection.sheetsFound.includes("Mixes_Internal"), "mix sheet missing");
  assert.ok(result.inspection.sheetsFound.includes("Mix_Components"), "component sheet missing");
  assert.ok(result.inspection.sheets.every(sheet => Array.isArray(sheet.headers)), "headers were not inspected");
  assert.ok(result.tobacco.length > 0, "tobacco staging is empty");
  assert.ok(result.components.length > 0, "component staging is empty");

  const allIdentityRecords = [...result.tobacco, ...result.components];
  const unresolvedNotGuessed = allIdentityRecords.filter(item => item.identityStatus === "UNRESOLVED" || item.identityStatus === "AMBIGUOUS").every(item => item.canonicalProductId === null);
  const tagValuesAreCategorical = result.tobacco.flatMap(item => item.derivedCharacteristics).filter(item => item.kind === "TAG_CATEGORY").every(item => typeof item.value === "string");
  const preliminaryAlwaysLow = result.tobacco.flatMap(item => item.derivedCharacteristics).filter(item => item.kind === "PRELIMINARY_INFERENCE").every(item => item.confidence === "LOW");
  const ratingsRemainSeparate = result.tobacco.every(item => item.externalRatings.every(rating => !item.observations.some(observation => observation.originalValue === rating.originalValue)));
  assert.ok(unresolvedNotGuessed, "unresolved or ambiguous identity was guessed");
  assert.ok(tagValuesAreCategorical, "tag-derived characteristic became numeric");
  assert.ok(preliminaryAlwaysLow, "preliminary inference exceeded LOW confidence");
  assert.ok(ratingsRemainSeparate, "external rating became a sensory observation");

  const privateTokens = [...new Set([
    ...result.mixes.flatMap(item => [item.internalAuthor, item.sourceUrl]),
    ...result.plan.mixRows.map(row => text(row.cells.channel)),
  ].filter((value): value is string => Boolean(value)))];
  const privacyIssues = auditImportedKnowledgePrivacy(result.publicRecords, privateTokens);
  assert.deepEqual(privacyIssues, []);

  if (useRealWorkbook) {
    const nash = allIdentityRecords.filter(item => item.manufacturer?.toLocaleLowerCase("ru-RU") === "наш");
    const dogma = allIdentityRecords.filter(item => item.manufacturer?.toLocaleLowerCase("ru-RU") === "dogma");
    assert.ok(nash.length > 0, "real workbook has no НАШ records");
    assert.ok(dogma.length > 0, "real workbook has no Dogma records");
    const nashCanonicalIds = new Set(nash.map(item => item.canonicalProductId).filter((value): value is string => Boolean(value)));
    const dogmaCanonicalIds = new Set(dogma.map(item => item.canonicalProductId).filter((value): value is string => Boolean(value)));
    assert.ok([...nashCanonicalIds].every(id => !dogmaCanonicalIds.has(id)), "НАШ and Dogma canonical identities overlap");
  } else {
    assert.ok(result.tobacco.some(item => item.identityStatus !== "RESOLVED"), "fixture must preserve non-resolved identity");
    const dogma = result.tobacco.find(item => item.manufacturer === "Dogma");
    const nash = result.tobacco.find(item => item.manufacturer === "НАШ");
    assert.equal(dogma?.manufacturerId, "dogma");
    assert.equal(nash?.manufacturerId, "nash");
    assert.notEqual(dogma?.canonicalProductId, nash?.canonicalProductId);
    assert.ok(result.tobacco.some(item => item.observations.some(observation => observation.sourceType === "SOURCE_STATED")));
    assert.ok(result.tobacco.some(item => item.externalRatings.length > 0));
    assert.ok(result.report.issues.some(issue => issue.code === "PRELIMINARY_VALUE_WITHOUT_LOW_CONFIDENCE"));
    assert.ok(result.report.validation.weightSumWarnings > 0);
  }

  assert.ok(Object.isFrozen(result.registry));
  assert.ok(Object.isFrozen(result.registry.records));
  assert.ok(Object.isFrozen(result.registry.report.issues));
  assert.doesNotThrow(() => JSON.parse(serializeExpertMixImportReport(result.report)));
  const repeated = useRealWorkbook
    ? await importExpertMixKnowledge(workbookPath)
    : await importExpertMixKnowledgeBuffer(await createSyntheticExpertMixWorkbookBuffer(), "<memory>/synthetic-expert-mix-import.xlsx");
  assert.deepEqual(result, repeated, "import must be deterministic");
  if (useRealWorkbook) assert.equal(createHash("sha256").update(await readFile(workbookPath)).digest("hex"), beforeHash, "source workbook changed");

  console.log(JSON.stringify({
    mode: useRealWorkbook ? "real-workbook" : "synthetic-fixture",
    workbookPath: useRealWorkbook ? workbookPath : null,
    sourceWorkbookUnchanged: true,
    checks: { unresolvedNotGuessed, tagValuesAreCategorical, preliminaryAlwaysLow, ratingsRemainSeparate, publicPrivacyIssues: privacyIssues.length },
    inspection: result.inspection.sheets.map(sheet => ({ name: sheet.name, state: sheet.state, rowCount: sheet.rowCount, dataRowCount: sheet.dataRowCount, headerRowNumber: sheet.headerRowNumber, unknownHeaders: sheet.unknownHeaders })),
    report: result.report,
  }, null, 2));
};

main().catch(error => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
