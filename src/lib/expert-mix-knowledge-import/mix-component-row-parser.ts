import { createExpertMixComponentId } from "../expert-mix-knowledge";
import { normalizeImportText, parseImportNumber } from "./normalizer";
import { resolveImportedTobaccoIdentity } from "./identity-mapper";
import type { NormalizedMixComponentStagingRecord, RawMixComponentRow } from "./types";

export const normalizeMixComponentRow = (row: RawMixComponentRow, workbookName: string): NormalizedMixComponentStagingRecord => {
  const mixId = normalizeImportText(row.cells.mixId) ?? ""; const manufacturer = normalizeImportText(row.cells.manufacturer); const productLine = normalizeImportText(row.cells.productLine); const productName = normalizeImportText(row.cells.productName);
  const displayName = [manufacturer, productLine, productName].filter(Boolean).join(" ") || `Строка ${row.rowNumber}`; const explicitCanonicalProductId = normalizeImportText(row.cells.canonicalProductId);
  const identity = resolveImportedTobaccoIdentity({ explicitCanonicalProductId, manufacturer, productLine, productName, displayName });
  return { mixId, componentId: createExpertMixComponentId({ workbookName, mixId, row: row.rowNumber, displayName }), position: parseImportNumber(row.cells.position) ?? row.rowNumber - 1, displayName, manufacturer, productLine, productName, explicitCanonicalProductId, identityStatus: identity.status, canonicalProductId: identity.canonicalProductId, manufacturerId: identity.manufacturerId, productLineId: identity.productLineId, percentage: parseImportNumber(row.cells.percentage), approximatePercentage: parseImportNumber(row.cells.approximatePercentage), parts: parseImportNumber(row.cells.parts), grams: parseImportNumber(row.cells.grams), role: normalizeImportText(row.cells.role), raw: row };
};
