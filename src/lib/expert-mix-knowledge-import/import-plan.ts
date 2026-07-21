import { OPTIONAL_EXPERT_MIX_SHEETS, REQUIRED_EXPERT_MIX_SHEETS } from "./constants";
import { findHeaderRow, resolveHeaderIndexes, rowsToRawEntities } from "./header-resolver";
import { deepCloneAndFreeze } from "./normalizer";
import type { ExpertMixImportIssue, ExpertMixImportPlan, ExpertMixWorkbookData, ExpertMixWorkbookInspection } from "./types";

const requiredHeaders: Record<string, readonly string[]> = { "ОСНОВНАЯ_БАЗА": ["manufacturer", "productName"], Mixes_Internal: ["mixId", "status"], Mix_Components: ["mixId", "productName", "position"] };
export const createExpertMixImportPlan = (workbook: ExpertMixWorkbookData, inspection: ExpertMixWorkbookInspection): ExpertMixImportPlan => {
  const issues: ExpertMixImportIssue[] = [];
  for (const missing of inspection.sheetsMissing) issues.push({ code: "SHEET_MISSING", severity: (REQUIRED_EXPERT_MIX_SHEETS as readonly string[]).includes(missing) ? "ERROR" : "WARNING", sheet: missing, message: `Лист ${missing} отсутствует.`, suggestedAction: (OPTIONAL_EXPERT_MIX_SHEETS as readonly string[]).includes(missing) ? "Допустимо для необязательного App-листа." : "Добавить обязательный лист или исправить имя." });
  for (const sheet of inspection.sheets) {
    if (sheet.dataRowCount === 0) issues.push({ code: "SHEET_EMPTY", severity: sheet.role.startsWith("PRIMARY") ? "ERROR" : "WARNING", sheet: sheet.name, message: "Лист не содержит строк данных." });
    if (sheet.role.startsWith("PRIMARY")) for (const header of sheet.duplicateHeaders) issues.push({ code: "HEADER_DUPLICATED", severity: "ERROR", sheet: sheet.name, field: header, message: `Заголовок ${header} повторяется.` });
    const source = workbook.sheets.find(item => item.name === sheet.name); if (!source) continue;
    const canonical = resolveHeaderIndexes(findHeaderRow(source)?.values ?? []);
    for (const header of requiredHeaders[sheet.name] ?? []) if (!(header in canonical)) issues.push({ code: "HEADER_MISSING", severity: "ERROR", sheet: sheet.name, field: header, message: `Обязательный заголовок ${header} не найден.` });
  }
  const raw = (name: string) => { const sheet = workbook.sheets.find(item => item.name === name); return sheet ? rowsToRawEntities(sheet) : []; };
  return deepCloneAndFreeze({ tobaccoRows: raw("ОСНОВНАЯ_БАЗА"), mixRows: raw("Mixes_Internal"), componentRows: raw("Mix_Components"), ignoredRows: inspection.sheets.filter(sheet => sheet.role === "DERIVED_APP" || sheet.role === "ARCHIVE_OR_UNKNOWN").reduce((sum, sheet) => sum + sheet.dataRowCount, 0), issues });
};
