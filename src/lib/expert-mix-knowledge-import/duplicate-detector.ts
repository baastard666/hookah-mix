import type { ExpertMixImportIssue, NormalizedMixComponentStagingRecord, NormalizedMixStagingRecord, NormalizedTobaccoStagingRecord } from "./types";

const normalized = (value: string | null) => value?.normalize("NFKC").trim().toLocaleLowerCase("ru-RU") ?? "";
export const detectExpertMixImportDuplicates = (tobacco: readonly NormalizedTobaccoStagingRecord[], mixes: readonly NormalizedMixStagingRecord[], components: readonly NormalizedMixComponentStagingRecord[]): readonly ExpertMixImportIssue[] => {
  const issues: ExpertMixImportIssue[] = [];
  const productKeys = new Map<string, NormalizedTobaccoStagingRecord>();
  for (const item of tobacco) { const key = item.canonicalProductId ? `id:${item.canonicalProductId}` : `name:${normalized(item.manufacturer)}|${normalized(item.productLine)}|${normalized(item.productName)}`; const previous = productKeys.get(key); if (previous) issues.push({ code: "DUPLICATE_PRODUCT_CANDIDATE", severity: "WARNING", sheet: item.raw.sheet, rowNumber: item.raw.rowNumber, entityId: item.stagingId, message: `Возможный дубль строки ${previous.raw.rowNumber}; автоматического объединения нет.` }); else productKeys.set(key, item); }
  const mixIds = new Set<string>(); const signatures = new Map<string, string>();
  for (const mix of mixes) {
    if (mixIds.has(mix.mixId)) issues.push({ code: "MIX_DUPLICATE_CANDIDATE", severity: "ERROR", sheet: mix.raw.sheet, rowNumber: mix.raw.rowNumber, entityId: mix.mixId, message: "mixId повторяется." }); else mixIds.add(mix.mixId);
    const own = components.filter(component => component.mixId === mix.mixId).sort((a, b) => a.position - b.position); const signature = JSON.stringify(own.map(item => [item.canonicalProductId ?? normalized(item.displayName), item.percentage, item.approximatePercentage, item.parts, item.grams])); const previous = signatures.get(signature); if (signature !== "[]" && previous) issues.push({ code: "MIX_DUPLICATE_CANDIDATE", severity: "WARNING", sheet: mix.raw.sheet, rowNumber: mix.raw.rowNumber, entityId: mix.mixId, message: `Состав совпадает с ${previous}; записи не объединены.` }); else signatures.set(signature, mix.mixId);
    const positions = new Set<number>(); const products = new Set<string>();
    for (const component of own) { if (positions.has(component.position)) issues.push({ code: "DUPLICATE_COMPONENT", severity: "ERROR", sheet: component.raw.sheet, rowNumber: component.raw.rowNumber, entityId: component.componentId, field: "position", message: "Позиция компонента повторяется." }); positions.add(component.position); const key = component.canonicalProductId ?? normalized(component.displayName); if (products.has(key)) issues.push({ code: "DUPLICATE_COMPONENT", severity: "WARNING", sheet: component.raw.sheet, rowNumber: component.raw.rowNumber, entityId: component.componentId, message: "Один продукт повторяется в миксе; строки сохранены отдельно." }); products.add(key); }
  }
  return issues;
};
