import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  auditImportedKnowledgePrivacy, createExpertMixImportPlan, createSyntheticExpertMixWorkbookBuffer, findHeaderRow, importExpertMixKnowledgeBuffer, inspectExpertMixWorkbookData,
  normalizeHeader, normalizeImportText, normalizeMixRow, parseImportNumber, readExpertMixWorkbookBuffer, readExpertMixWorkbookSafe, resolveHeaderIndexes,
  resolveImportedTobaccoIdentity, serializeExpertMixImportReport, splitImportTags,
} from "./index";

const imported = async () => importExpertMixKnowledgeBuffer(await createSyntheticExpertMixWorkbookBuffer(), "C:\\private\\hookah_mix_database_v2.xlsx");

const prefixSpreadsheetMlElements = async (buffer: Buffer): Promise<Buffer> => {
  const namespace = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const archive = await JSZip.loadAsync(buffer);
  const entries = Object.values(archive.files).filter(entry => !entry.dir && entry.name.endsWith(".xml"));
  await Promise.all(entries.map(async entry => {
    const xml = await entry.async("string");
    if (!xml.includes(`xmlns="${namespace}"`)) return;
    archive.file(entry.name, xml
      .replace(`xmlns="${namespace}"`, `xmlns:x="${namespace}"`)
      .replace(/<(\/?)([A-Za-z_][\w.-]*)(?=[\s/>])/g, "<$1x:$2"));
  }));
  return Buffer.from(await archive.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

describe("workbook reader and inspection", () => {
  it("reads an xlsx buffer", async () => expect((await readExpertMixWorkbookBuffer(await createSyntheticExpertMixWorkbookBuffer())).sheets.length).toBe(6));
  it("reads SpreadsheetML elements with an explicit x prefix", async () => {
    const prefixed = await prefixSpreadsheetMlElements(await createSyntheticExpertMixWorkbookBuffer());
    expect((await readExpertMixWorkbookBuffer(prefixed)).sheets.map(sheet => sheet.name)).toEqual(expect.arrayContaining(["ОСНОВНАЯ_БАЗА", "Mixes_Internal", "Mix_Components"]));
  });
  it("does not mutate a prefixed source buffer", async () => {
    const prefixed = await prefixSpreadsheetMlElements(await createSyntheticExpertMixWorkbookBuffer());
    const before = Buffer.from(prefixed);
    await readExpertMixWorkbookBuffer(prefixed);
    expect(prefixed.equals(before)).toBe(true);
  });
  it("finds a real header below merged title rows", () => {
    const sheet = { name: "Mixes_Internal", state: "visible" as const, mergedRanges: [], formulaCellCount: 0, errorCellCount: 0, rows: [
      { rowNumber: 1, values: ["ВНУТРЕННИЙ ЛИСТ", "ВНУТРЕННИЙ ЛИСТ"], isEmpty: false },
      { rowNumber: 2, values: ["mix_id", "recipe_status", "title_internal"], isEmpty: false },
    ] };
    expect(findHeaderRow(sheet)?.rowNumber).toBe(2);
  });
  it("detects expected primary sheets", async () => expect((await imported()).inspection.sheetsFound).toEqual(expect.arrayContaining(["ОСНОВНАЯ_БАЗА", "Mixes_Internal", "Mix_Components"])));
  it("marks App sheets as derived", async () => expect((await imported()).inspection.sheets.find(sheet => sheet.name === "App_Tobacco")?.role).toBe("DERIVED_APP"));
  it("detects hidden sheets", async () => expect((await imported()).inspection.sheets.find(sheet => sheet.name === "App_Mixes")?.state).toBe("hidden"));
  it("detects very hidden archive", async () => expect((await imported()).inspection.sheets.find(sheet => sheet.name === "Archive")?.state).toBe("veryHidden"));
  it("detects formulas", async () => expect((await imported()).inspection.totalFormulaCells).toBe(1));
  it("detects merged ranges", async () => expect((await imported()).inspection.sheets.find(sheet => sheet.name === "App_Tobacco")?.mergedRanges).toContain("A3:B3"));
  it("counts data rows", async () => expect((await imported()).inspection.totalRows).toBeGreaterThan(30));
  it("counts empty rows inside used ranges", async () => expect((await imported()).inspection.sheets.find(sheet => sheet.name === "ОСНОВНАЯ_БАЗА")?.emptyRowCount).toBeGreaterThan(0));
  it("reports missing optional sheet", async () => { const workbook = await readExpertMixWorkbookBuffer(await createSyntheticExpertMixWorkbookBuffer()); const withoutApp = { ...workbook, sheets: workbook.sheets.filter(sheet => sheet.name !== "App_Mixes") }; expect(inspectExpertMixWorkbookData(withoutApp).sheetsMissing).toContain("App_Mixes"); });
  it("returns a typed missing-file error", async () => expect(await readExpertMixWorkbookSafe("Z:\\missing\\database.xlsx")).toMatchObject({ success: false, issue: { code: "WORKBOOK_NOT_FOUND" } }));
  it("reports a missing required header", async () => { const workbook = await readExpertMixWorkbookBuffer(await createSyntheticExpertMixWorkbookBuffer()); const changed = { ...workbook, sheets: workbook.sheets.map(sheet => sheet.name === "Mixes_Internal" ? { ...sheet, rows: sheet.rows.map((row, index) => index === 0 ? { ...row, values: row.values.map(value => value === "mix_id" ? "wrong_header" : value) } : row) } : sheet) }; const inspection = inspectExpertMixWorkbookData(changed); expect(createExpertMixImportPlan(changed, inspection).issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "HEADER_MISSING", field: "mixId" })])); });
});

describe("headers and cell parsing", () => {
  it("normalizes a missing optional cell to null instead of the string undefined", () => expect(normalizeImportText(undefined)).toBeNull());
  it.each([[" Производитель ", "производитель"], ["Product Line", "product_line"], ["ID-микса", "id_микса"]])("normalizes header %s", (input, output) => expect(normalizeHeader(input)).toBe(output));
  it("resolves Russian and English aliases", () => expect(resolveHeaderIndexes(["бренд", "линейка", "вкус"])).toEqual({ manufacturer: 0, productLine: 1, productName: 2 }));
  it("resolves headers used by the real workbook", () => expect(resolveHeaderIndexes(["Бренд", "Линейка", "Вкус / продукт", "Оценка 1–10", "Количество обзоров"])).toMatchObject({ manufacturer: 0, productLine: 1, productName: 2, rating: 3, sampleSize: 4 }));
  it.each([["4,7", 4.7], [" 50% ", 50], [10, 10], ["bad", null], [null, null]] as const)("parses numeric cell %s", (input, output) => expect(parseImportNumber(input)).toBe(output));
  it("normalizes and deduplicates tags", () => expect(splitImportTags(" Ягодный; цветочный | ягодный ")).toEqual(["ягодный", "цветочный"]));
});

describe("identity mapping", () => {
  it("resolves explicit Darkside Core identity", () => expect(resolveImportedTobaccoIdentity({ manufacturer: "Darkside", productLine: "Core", productName: "Supernova" })).toMatchObject({ status: "RESOLVED", canonicalProductId: "darkside-core-supernova", manufacturerId: "darkside" }));
  it("keeps Dogma without line manufacturer-only", () => expect(resolveImportedTobaccoIdentity({ manufacturer: "Dogma", productName: "Крымская лаванда" })).toMatchObject({ status: "MANUFACTURER_ONLY", manufacturerId: "dogma" }));
  it("keeps НАШ as its own manufacturer-only identity", () => expect(resolveImportedTobaccoIdentity({ manufacturer: "НАШ", productName: "Лаванда" })).toMatchObject({ status: "MANUFACTURER_ONLY", manufacturerId: "nash", canonicalProductId: "nash-manufacturer-only-лаванда" }));
  it("does not match by flavor word", () => expect(resolveImportedTobaccoIdentity({ manufacturer: "Unknown", productName: "Крымская лаванда" }).canonicalProductId).toBeNull());
  it("does not merge НАШ and Dogma", async () => { const result = await imported(); const dogma = result.tobacco.find(item => item.manufacturer === "Dogma"); const nash = result.tobacco.find(item => item.manufacturer === "НАШ"); expect(dogma?.manufacturerId).toBe("dogma"); expect(nash?.manufacturerId).toBe("nash"); expect(dogma?.canonicalProductId).not.toBe(nash?.canonicalProductId); });
  it("keeps unresolved records importable", async () => expect((await imported()).report.tobacco.unresolved).toBeGreaterThan(0));
  it("emits manufacturer-only audit issues", async () => expect((await imported()).report.issues.some(issue => issue.code === "IDENTITY_MANUFACTURER_ONLY")).toBe(true));
});

describe("fact provenance", () => {
  it("creates catalog facts separately", async () => expect((await imported()).tobacco[0]?.catalogFacts.some(fact => fact.sourceType === "CATALOG_FACT")).toBe(true));
  it("creates real experience as SOURCE_STATED observation", async () => expect((await imported()).tobacco[0]?.observations[0]).toMatchObject({ observationType: "REAL_EXPERIENCE", sourceType: "SOURCE_STATED" }));
  it("does not turn a rating into an observation", async () => { const tobacco = (await imported()).tobacco[0]!; expect(tobacco.externalRatings).toHaveLength(1); expect(tobacco.observations.some(item => item.value.includes("4.7"))).toBe(false); });
  it("preserves original rating scale and sample", async () => expect((await imported()).tobacco[0]?.externalRatings[0]).toMatchObject({ originalValue: 4.7, originalScale: 5, normalizedValue10: 9.4, sampleSize: 120 }));
  it("derives only categorical values from tags", async () => { const derived = (await imported()).tobacco[0]?.derivedCharacteristics.filter(item => item.kind === "TAG_CATEGORY") ?? []; expect(derived.length).toBeGreaterThan(0); expect(derived.every(item => typeof item.value === "string" && item.sourceType === "DERIVED")).toBe(true); });
  it("keeps preliminary inference separate", async () => expect((await imported()).tobacco[0]?.derivedCharacteristics.find(item => item.kind === "PRELIMINARY_INFERENCE")).toMatchObject({ confidence: "LOW", sourceType: "DERIVED" }));
  it("rejects preliminary inference with elevated confidence", async () => expect((await imported()).report.issues.some(issue => issue.code === "PRELIMINARY_VALUE_WITHOUT_LOW_CONFIDENCE")).toBe(true));
  it("never exposes a preliminary inference above LOW confidence", async () => expect((await imported()).tobacco.flatMap(item => item.derivedCharacteristics).filter(item => item.kind === "PRELIMINARY_INFERENCE").every(item => item.confidence === "LOW")).toBe(true));
  it("stores provenance per value", async () => expect((await imported()).tobacco[0]?.catalogFacts[0]?.importedFrom).toMatchObject({ sheet: "ОСНОВНАЯ_БАЗА", rowNumber: 2 }));
});

describe("mix mapping and validation", () => {
  it.each([
    ["tested", true, "exact", "yes", "VERIFIED"],
    ["tested", true, "partial_product", "review", "PARTIALLY_VERIFIED"],
    ["proposed_then_test_unknown", false, "partial", "no", "DRAFT"],
    ["tested", true, "inconsistent_source_weights", "review", "DISPUTED"],
  ] as const)("maps real workbook status %s/%s/%s", (status, tested, quality, ready, expected) => {
    const row = { sheet: "Mixes_Internal", rowNumber: 3, cells: { mixId: "mix-real", status, tested, proportionType: quality, exportReady: ready } };
    expect(normalizeMixRow(row, "fixture.xlsx").status).toBe(expected);
  });
  it("imports valid 100 percent mix", async () => expect((await imported()).registry.records.some(record => record.title === "Валидный 60/40")).toBe(true));
  it("accepts 99 percent as explicit rounding warning", async () => { const result = await imported(); expect(result.report.issues.some(issue => issue.entityId === "mix-99" && issue.code === "PERCENT_SUM_ROUNDING")).toBe(true); expect(result.registry.records.some(record => record.title === "Округление")).toBe(true); });
  it("rejects 120 percent domain record", async () => { const result = await imported(); expect(result.report.issues.some(issue => issue.entityId === "mix-120" && issue.code === "PERCENT_SUM_MISMATCH")).toBe(true); expect(result.rejectedMixIds).toContain("mix-120"); });
  it("audits total weight mismatch", async () => expect((await imported()).report.issues.some(issue => issue.entityId === "mix-grams" && issue.code === "TOTAL_WEIGHT_MISMATCH")).toBe(true));
  it("does not leave weight-conflicted record VERIFIED", async () => expect((await imported()).registry.records.find(record => record.title === "Граммы")?.status).toBe("PARTIALLY_VERIFIED"));
  it("preserves PARTS", async () => expect((await imported()).registry.records.find(record => record.title === "Части")?.proportions.type).toBe("PARTS"));
  it("preserves ORDER_ONLY", async () => expect((await imported()).registry.records.find(record => record.title === "Порядок")?.proportions.type).toBe("ORDER_ONLY"));
  it("preserves UNKNOWN", async () => expect((await imported()).registry.records.find(record => record.title === "Неизвестно")?.proportions.type).toBe("UNKNOWN"));
  it("reports orphan components", async () => expect((await imported()).report.components.orphaned).toBe(1));
  it("reports invalid numeric cells", async () => expect((await imported()).report.issues.some(issue => issue.code === "INVALID_NUMERIC_CELL" && issue.originalValue === "abc")).toBe(true));
  it("reports missing source", async () => expect((await imported()).report.validation.missingSourceWarnings).toBeGreaterThan(0));
  it("reports missing status without guessing VERIFIED", async () => { const result = await imported(); expect(result.report.issues.some(issue => issue.entityId === "mix-no-status" && issue.code === "MIX_STATUS_MISSING")).toBe(true); expect(result.registry.records.find(record => record.title === "Нет статуса")?.status).toBe("DRAFT"); });
  it("keeps aggregate rating in original scale", async () => expect((await imported()).registry.records.find(record => record.title === "Валидный 60/40")?.evaluation?.rating).toEqual({ scale: 10, value: 8 }));
  it("does not generate compatibility observations", async () => expect((await imported()).registry.records.flatMap(record => record.observations).some(observation => observation.type === "COMPATIBILITY")).toBe(false));
});

describe("duplicates, privacy and immutability", () => {
  it("reports duplicate products", async () => expect((await imported()).report.tobacco.duplicates).toBeGreaterThan(0));
  it("reports duplicate mix compositions", async () => expect((await imported()).report.mixes.duplicateCandidates).toBeGreaterThan(0));
  it("does not merge duplicate candidates", async () => expect((await imported()).registry.records.filter(record => ["Валидный 60/40", "Дубль состава"].includes(record.title ?? ""))).toHaveLength(2));
  it("removes internal author from public output", async () => expect(JSON.stringify((await imported()).publicRecords)).not.toContain("Private Channel"));
  it("removes private URL from public output", async () => expect(JSON.stringify((await imported()).publicRecords)).not.toContain("private.example"));
  it("removes local workbook path and row numbers", async () => { const json = JSON.stringify((await imported()).publicRecords); expect(json).not.toContain("C:\\private"); expect(json).not.toContain("rowNumber"); expect(json).not.toContain("Imported from"); });
  it("passes explicit privacy audit", async () => expect(auditImportedKnowledgePrivacy((await imported()).publicRecords, ["Private Channel", "private.example"])).toEqual([]));
  it("deep-freezes registry", async () => { const registry = (await imported()).registry; expect(Object.isFrozen(registry)).toBe(true); expect(Object.isFrozen(registry.records)).toBe(true); expect(Object.isFrozen(registry.records[0]?.components)).toBe(true); expect(Object.isFrozen(registry.report.issues)).toBe(true); });
  it("does not expose mutable maps", async () => expect((await imported()).registry).not.toHaveProperty("map"));
});

describe("determinism and report", () => {
  it("returns identical output for identical input", async () => { const buffer = await createSyntheticExpertMixWorkbookBuffer(); const first = await importExpertMixKnowledgeBuffer(buffer); const second = await importExpertMixKnowledgeBuffer(buffer); expect(first).toEqual(second); });
  it("serializes report to JSON", async () => expect(JSON.parse(serializeExpertMixImportReport((await imported()).report)).summary.workbookName).toBe("hookah_mix_database_v2.xlsx"));
  it("contains typed summary counters", async () => expect((await imported()).report.summary).toMatchObject({ totalRowsRead: expect.any(Number), totalWarnings: expect.any(Number), totalErrors: expect.any(Number) }));
  it("does not include App rows as primary imports", async () => expect((await imported()).plan.ignoredRows).toBeGreaterThan(0));
  it("supports strict unresolved option", async () => expect((await importExpertMixKnowledgeBuffer(await createSyntheticExpertMixWorkbookBuffer(), "fixture.xlsx", { failOnUnresolvedIdentity: true })).report.issues.some(issue => issue.code === "IDENTITY_NOT_FOUND" && issue.severity === "ERROR")).toBe(true));
});
