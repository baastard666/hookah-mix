import { OPTIONAL_EXPERT_MIX_SHEETS, REQUIRED_EXPERT_MIX_SHEETS } from "./constants";
import { deepCloneAndFreeze, normalizeHeader } from "./normalizer";
import type { ExcelSheetInspection, ExpertMixWorkbookData, ExpertMixWorkbookInspection } from "./types";
import { readExpertMixWorkbook } from "./workbook-reader";

const role = (name: string): ExcelSheetInspection["role"] => name === "ОСНОВНАЯ_БАЗА" ? "PRIMARY_TOBACCO" : name === "Mixes_Internal" ? "PRIMARY_MIX" : name === "Mix_Components" ? "PRIMARY_COMPONENT" : (OPTIONAL_EXPERT_MIX_SHEETS as readonly string[]).includes(name) ? "DERIVED_APP" : "ARCHIVE_OR_UNKNOWN";
export const inspectExpertMixWorkbookData = (workbook: ExpertMixWorkbookData): ExpertMixWorkbookInspection => {
  const sheets = workbook.sheets.map(sheet => {
    const headers = sheet.rows[0]?.values.map(value => value === null ? "" : String(value)) ?? [];
    const normalizedHeaders = headers.map(normalizeHeader);
    const duplicateHeaders = [...new Set(normalizedHeaders.filter((header, index) => header && normalizedHeaders.indexOf(header) !== index))].sort();
    const emptyColumnIndexes = headers.map((_, index) => index).filter(index => sheet.rows.every(row => row.values[index] === null || row.values[index] === ""));
    return { name: sheet.name, state: sheet.state, role: role(sheet.name), rowCount: sheet.rows.length, dataRowCount: sheet.rows.slice(1).filter(row => !row.isEmpty).length, emptyRowCount: sheet.rows.slice(1).filter(row => row.isEmpty).length, columnCount: headers.length, headers, normalizedHeaders, duplicateHeaders, emptyColumnIndexes, formulaCellCount: sheet.formulaCellCount, errorCellCount: sheet.errorCellCount, mergedRanges: sheet.mergedRanges };
  });
  const found = sheets.map(sheet => sheet.name);
  return deepCloneAndFreeze({ workbookPath: workbook.workbookPath, workbookName: workbook.workbookName, sheets, sheetsFound: [...found].sort(), sheetsMissing: [...REQUIRED_EXPERT_MIX_SHEETS, ...OPTIONAL_EXPERT_MIX_SHEETS].filter(name => !found.includes(name)), totalRows: sheets.reduce((sum, sheet) => sum + sheet.dataRowCount, 0), totalFormulaCells: sheets.reduce((sum, sheet) => sum + sheet.formulaCellCount, 0), totalErrorCells: sheets.reduce((sum, sheet) => sum + sheet.errorCellCount, 0) });
};
export const inspectExpertMixWorkbook = async (workbookPath: string): Promise<ExpertMixWorkbookInspection> => inspectExpertMixWorkbookData(await readExpertMixWorkbook(workbookPath));
