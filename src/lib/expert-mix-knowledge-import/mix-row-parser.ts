import type { ExpertMixRecordStatus } from "../expert-mix-knowledge";
import { normalizeImportText, parseImportNumber, splitImportTags } from "./normalizer";
import type { ImportedExternalRating, ImportedFrom, NormalizedMixStagingRecord, RawMixRow } from "./types";

const statuses: readonly ExpertMixRecordStatus[] = ["DRAFT", "VERIFIED", "PARTIALLY_VERIFIED", "DISPUTED", "REJECTED", "ARCHIVED"];
export const normalizeMixRow = (row: RawMixRow, workbookName: string): NormalizedMixStagingRecord => {
  const mixId = normalizeImportText(row.cells.mixId) ?? ""; const source = normalizeImportText(row.cells.author) ?? "Excel mix row"; const sourceReference = normalizeImportText(row.cells.sourceUrl) ?? undefined;
  const rawStatus = normalizeImportText(row.cells.status)?.toUpperCase() as ExpertMixRecordStatus | undefined; const status = rawStatus && statuses.includes(rawStatus) ? rawStatus : null;
  const rawType = normalizeImportText(row.cells.proportionType)?.toUpperCase(); const proportionType = (["PERCENT", "PARTS", "ORDER_ONLY", "UNKNOWN"] as const).find(type => type === rawType) ?? "UNKNOWN";
  const importedFrom: ImportedFrom = { workbookName, sheet: row.sheet, rowNumber: row.rowNumber }; const ratingValue = parseImportNumber(row.cells.rating); const scale = parseImportNumber(row.cells.ratingScale) ?? 10; const sampleSize = parseImportNumber(row.cells.sampleSize);
  const rating: ImportedExternalRating | null = ratingValue !== null && scale > 0 ? { originalValue: ratingValue, originalScale: scale, normalizedValue10: Math.round((ratingValue / scale) * 100) / 10, ...(sampleSize !== null ? { sampleSize } : {}), source, ...(sourceReference ? { sourceReference } : {}), confidence: sampleSize && sampleSize > 1 ? "MEDIUM" : "LOW", importedFrom } : null;
  return { mixId, title: normalizeImportText(row.cells.title), status, proportionType, declaredTotalWeightGrams: parseImportNumber(row.cells.totalWeight), sourceUrl: sourceReference ?? null, internalAuthor: normalizeImportText(row.cells.author), observation: normalizeImportText(row.cells.observation), rating, tags: splitImportTags(row.cells.tags), raw: row };
};
