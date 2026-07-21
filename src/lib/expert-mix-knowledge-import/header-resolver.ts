import { HEADER_ALIASES } from "./constants";
import { normalizeHeader } from "./normalizer";
import type { ExcelCellValue, ExcelSheetData, RawExcelEntityRow } from "./types";

export type CanonicalHeader = keyof typeof HEADER_ALIASES;
export const resolveHeaderIndexes = (headers: readonly ExcelCellValue[]): Readonly<Partial<Record<CanonicalHeader, number>>> => {
  const normalized = headers.map(normalizeHeader);
  return Object.fromEntries(Object.entries(HEADER_ALIASES).flatMap(([canonical, aliases]) => { const index = normalized.findIndex(header => (aliases as readonly string[]).includes(header)); return index >= 0 ? [[canonical, index]] : []; })) as Partial<Record<CanonicalHeader, number>>;
};
export const findHeaderRow = (sheet: ExcelSheetData): ExcelSheetData["rows"][number] | null => {
  const nonEmptyRows = sheet.rows.filter(row => !row.isEmpty);
  const withoutMergedTitle = nonEmptyRows.filter(row => {
    const values = row.values.map(normalizeHeader).filter(Boolean);
    return !(values.length > 1 && new Set(values).size === 1);
  });
  const sourceRows = withoutMergedTitle.length > 0 ? withoutMergedTitle : nonEmptyRows;
  const useCanonicalScore = ["ОСНОВНАЯ_БАЗА", "Mixes_Internal", "Mix_Components", "App_Tobacco", "App_Mixes"].includes(sheet.name);
  const candidates = sourceRows.map(row => ({ row, score: useCanonicalScore ? Object.keys(resolveHeaderIndexes(row.values)).length : 0 }));
  if (candidates.length === 0) return null;
  return candidates.reduce((best, candidate) => candidate.score > best.score ? candidate : best).row;
};
export const rowsToRawEntities = (sheet: ExcelSheetData): readonly RawExcelEntityRow[] => {
  const header = findHeaderRow(sheet);
  if (!header) return [];
  const indexes = resolveHeaderIndexes(header.values);
  return sheet.rows.filter(row => row.rowNumber > header.rowNumber && !row.isEmpty).map(row => ({ sheet: sheet.name, rowNumber: row.rowNumber, cells: Object.fromEntries(Object.entries(indexes).map(([key, index]) => [key, row.values[index!] ?? null])) }));
};
