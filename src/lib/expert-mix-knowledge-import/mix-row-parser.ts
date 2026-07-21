import type { ExpertMixRecordStatus } from "../expert-mix-knowledge";
import { normalizeImportText, parseImportNumber, splitImportTags } from "./normalizer";
import type { ImportedExternalRating, ImportedFrom, NormalizedMixStagingRecord, RawMixRow } from "./types";

const statuses: readonly ExpertMixRecordStatus[] = ["DRAFT", "VERIFIED", "PARTIALLY_VERIFIED", "DISPUTED", "REJECTED", "ARCHIVED"];
const trueValues = new Set(["TRUE", "YES", "ДА", "1"]);
const normalizeStatus = (rawStatus: string | null, tested: boolean, ratioQuality: string | null, exportReady: string | null): ExpertMixRecordStatus | null => {
  const direct = rawStatus?.toUpperCase() as ExpertMixRecordStatus | undefined;
  if (direct && statuses.includes(direct)) return direct;
  const sourceStatus = rawStatus?.toLocaleLowerCase("en-US");
  const quality = ratioQuality?.toLocaleLowerCase("en-US");
  const readiness = exportReady?.toLocaleLowerCase("en-US");
  if (!sourceStatus) return null;
  if (quality === "inconsistent_source_weights") return "DISPUTED";
  if (!tested || sourceStatus === "proposed_then_test_unknown") return "DRAFT";
  if (["partial", "partial_product"].includes(quality ?? "") || readiness === "review") return "PARTIALLY_VERIFIED";
  if (["tested", "published_recipe"].includes(sourceStatus ?? "") && ["exact", "exact_grams"].includes(quality ?? "")) return "VERIFIED";
  return null;
};
export const normalizeMixRow = (row: RawMixRow, workbookName: string): NormalizedMixStagingRecord => {
  const mixId = normalizeImportText(row.cells.mixId) ?? ""; const source = normalizeImportText(row.cells.author) ?? "Excel mix row"; const sourceReference = normalizeImportText(row.cells.sourceUrl) ?? undefined;
  const rawStatus = normalizeImportText(row.cells.status); const ratioQuality = normalizeImportText(row.cells.proportionType); const exportReady = normalizeImportText(row.cells.exportReady); const tested = row.cells.tested === true || trueValues.has(normalizeImportText(row.cells.tested)?.toUpperCase() ?? "");
  const status = normalizeStatus(rawStatus, tested, ratioQuality, exportReady);
  const rawType = ratioQuality?.toUpperCase(); const directType = (["PERCENT", "PARTS", "ORDER_ONLY", "UNKNOWN"] as const).find(type => type === rawType);
  const proportionType = directType ?? (["exact", "exact_grams", "partial", "partial_product"].includes(ratioQuality?.toLocaleLowerCase("en-US") ?? "") ? "PERCENT" : "UNKNOWN");
  const importedFrom: ImportedFrom = { workbookName, sheet: row.sheet, rowNumber: row.rowNumber }; const ratingValue = parseImportNumber(row.cells.rating); const scale = parseImportNumber(row.cells.ratingScale) ?? 10; const sampleSize = parseImportNumber(row.cells.sampleSize);
  const rating: ImportedExternalRating | null = ratingValue !== null && scale > 0 ? { originalValue: ratingValue, originalScale: scale, normalizedValue10: Math.round((ratingValue / scale) * 100) / 10, ...(sampleSize !== null ? { sampleSize } : {}), source, ...(sourceReference ? { sourceReference } : {}), confidence: sampleSize && sampleSize > 1 ? "MEDIUM" : "LOW", importedFrom } : null;
  return { mixId, title: normalizeImportText(row.cells.title), status, proportionType, declaredTotalWeightGrams: parseImportNumber(row.cells.totalWeight), ratioQuality, sourceUrl: sourceReference ?? null, internalAuthor: normalizeImportText(row.cells.author), observation: normalizeImportText(row.cells.observation), rating, tags: splitImportTags(row.cells.tags), raw: row };
};
