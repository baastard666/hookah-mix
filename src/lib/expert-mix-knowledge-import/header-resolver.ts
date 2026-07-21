import { HEADER_ALIASES } from "./constants";
import { normalizeHeader } from "./normalizer";
import type { ExcelCellValue, ExcelSheetData, RawExcelEntityRow } from "./types";

export type CanonicalHeader = keyof typeof HEADER_ALIASES;
export const resolveHeaderIndexes = (headers: readonly ExcelCellValue[]): Readonly<Partial<Record<CanonicalHeader, number>>> => {
  const normalized = headers.map(normalizeHeader);
  return Object.fromEntries(Object.entries(HEADER_ALIASES).flatMap(([canonical, aliases]) => { const index = normalized.findIndex(header => (aliases as readonly string[]).includes(header)); return index >= 0 ? [[canonical, index]] : []; })) as Partial<Record<CanonicalHeader, number>>;
};
export const rowsToRawEntities = (sheet: ExcelSheetData): readonly RawExcelEntityRow[] => {
  const headers = sheet.rows[0]?.values ?? [];
  const indexes = resolveHeaderIndexes(headers);
  return sheet.rows.slice(1).filter(row => !row.isEmpty).map(row => ({ sheet: sheet.name, rowNumber: row.rowNumber, cells: Object.fromEntries(Object.entries(indexes).map(([key, index]) => [key, row.values[index!] ?? null])) }));
};
