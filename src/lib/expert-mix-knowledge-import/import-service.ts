import path from "node:path";
import type { ExpertMixKnowledgeRecord } from "../expert-mix-knowledge";
import { DEFAULT_EXPERT_MIX_IMPORT_OPTIONS } from "./constants";
import { detectExpertMixImportDuplicates } from "./duplicate-detector";
import { createExpertMixImportPlan } from "./import-plan";
import { createExpertMixImportReport } from "./import-report";
import { createImportedExpertMixRegistry } from "./import-registry";
import { validateExpertMixImport } from "./import-validator";
import { mapKnowledgeRecordsToPublic, mapStagingMixToKnowledgeRecord } from "./knowledge-record-mapper";
import { normalizeMixComponentRow } from "./mix-component-row-parser";
import { normalizeMixRow } from "./mix-row-parser";
import { deepCloneAndFreeze } from "./normalizer";
import { auditImportedKnowledgePrivacy } from "./privacy-auditor";
import { normalizeTobaccoRow } from "./tobacco-row-parser";
import { inspectExpertMixWorkbookData } from "./workbook-inspector";
import { readExpertMixWorkbook, readExpertMixWorkbookBuffer } from "./workbook-reader";
import type { ExpertMixImportIssue, ExpertMixImportOptions, ExpertMixImportResult, ExpertMixWorkbookData } from "./types";

const sortIssues = (issues: readonly ExpertMixImportIssue[]) => [...issues].sort((a, b) => (a.sheet ?? "").localeCompare(b.sheet ?? "") || (a.rowNumber ?? 0) - (b.rowNumber ?? 0) || a.code.localeCompare(b.code));
export const importExpertMixKnowledgeData = (workbook: ExpertMixWorkbookData, partialOptions: Partial<ExpertMixImportOptions> = {}): ExpertMixImportResult => {
  const options: ExpertMixImportOptions = { ...DEFAULT_EXPERT_MIX_IMPORT_OPTIONS, ...partialOptions };
  const inspection = inspectExpertMixWorkbookData(workbook); const plan = createExpertMixImportPlan(workbook, inspection);
  const tobacco = plan.tobaccoRows.map(row => normalizeTobaccoRow(row, workbook.workbookName)); const mixes = plan.mixRows.map(row => normalizeMixRow(row, workbook.workbookName)); const components = plan.componentRows.map(row => normalizeMixComponentRow(row, workbook.workbookName));
  const validationIssues = validateExpertMixImport(tobacco, mixes, components, options); const duplicateIssues = detectExpertMixImportDuplicates(tobacco, mixes, components); const baseIssues = [...plan.issues, ...validationIssues, ...duplicateIssues];
  const records: ExpertMixKnowledgeRecord[] = []; const mapperIssues: ExpertMixImportIssue[] = []; const rejectedMixIds: string[] = [];
  for (const mix of mixes) { const mapped = mapStagingMixToKnowledgeRecord(mix, components, options, baseIssues); mapperIssues.push(...mapped.issues); if (mapped.record && !records.some(record => record.id === mapped.record!.id)) records.push(mapped.record); else rejectedMixIds.push(mix.mixId); }
  const publicRecords = mapKnowledgeRecordsToPublic(records); const privateTokens = mixes.flatMap(mix => [mix.internalAuthor, mix.sourceUrl]).filter((value): value is string => Boolean(value)); const privacyIssues = auditImportedKnowledgePrivacy(publicRecords, privateTokens);
  const issues = sortIssues([...baseIssues, ...mapperIssues, ...privacyIssues]); const report = createExpertMixImportReport(inspection, plan, tobacco, mixes, components, records, issues, options); const registry = createImportedExpertMixRegistry(records, tobacco, report);
  return deepCloneAndFreeze({ inspection, plan, tobacco, mixes, components, rejectedMixIds, registry, publicRecords, report });
};
export const importExpertMixKnowledgeBuffer = async (buffer: Buffer, workbookPath = "<memory>/synthetic.xlsx", options: Partial<ExpertMixImportOptions> = {}) => importExpertMixKnowledgeData(await readExpertMixWorkbookBuffer(buffer, workbookPath), options);
export const importExpertMixKnowledge = async (workbookPath: string, options: Partial<ExpertMixImportOptions> = {}) => importExpertMixKnowledgeData(await readExpertMixWorkbook(workbookPath), options);
export const readExpertMixWorkbookSafe = async (workbookPath: string): Promise<{ readonly success: true; readonly workbook: ExpertMixWorkbookData } | { readonly success: false; readonly issue: ExpertMixImportIssue }> => {
  try { return { success: true, workbook: await readExpertMixWorkbook(workbookPath) }; } catch (error) { const notFound = error instanceof Error && "code" in error && error.code === "ENOENT"; return { success: false, issue: { code: notFound ? "WORKBOOK_NOT_FOUND" : "WORKBOOK_READ_FAILED", severity: "ERROR", originalValue: path.basename(workbookPath), message: notFound ? "Excel workbook не найден." : `Не удалось прочитать workbook: ${error instanceof Error ? error.message : String(error)}` } }; }
};
