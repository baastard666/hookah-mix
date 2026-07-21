import type { ExpertMixImportIssue, ExpertMixImportOptions, NormalizedMixComponentStagingRecord, NormalizedMixStagingRecord, NormalizedTobaccoStagingRecord } from "./types";
import { normalizeImportText } from "./normalizer";

const identityIssue = (entity: NormalizedTobaccoStagingRecord | NormalizedMixComponentStagingRecord): ExpertMixImportIssue | null => {
  const raw = entity.raw;
  if (entity.identityStatus === "RESOLVED") return null;
  const code = entity.identityStatus === "AMBIGUOUS" ? "IDENTITY_AMBIGUOUS" : entity.identityStatus === "MANUFACTURER_ONLY" ? "IDENTITY_MANUFACTURER_ONLY" : "IDENTITY_NOT_FOUND";
  return { code, severity: "WARNING", sheet: raw.sheet, rowNumber: raw.rowNumber, entityId: "stagingId" in entity ? entity.stagingId : entity.componentId, field: "identity", originalValue: entity.displayName, message: `${entity.displayName}: identity ${entity.identityStatus}.`, suggestedAction: "Проверить manufacturer, productLine и canonical ID вручную." };
};
export const validateExpertMixImport = (tobacco: readonly NormalizedTobaccoStagingRecord[], mixes: readonly NormalizedMixStagingRecord[], components: readonly NormalizedMixComponentStagingRecord[], options: ExpertMixImportOptions): readonly ExpertMixImportIssue[] => {
  const issues: ExpertMixImportIssue[] = [];
  for (const item of tobacco) {
    if (!item.manufacturer) issues.push({ code: "MANUFACTURER_MISSING", severity: "ERROR", sheet: item.raw.sheet, rowNumber: item.raw.rowNumber, entityId: item.stagingId, field: "manufacturer", message: "Производитель не указан." });
    if (!item.productName) issues.push({ code: "PRODUCT_NAME_MISSING", severity: "ERROR", sheet: item.raw.sheet, rowNumber: item.raw.rowNumber, entityId: item.stagingId, field: "productName", message: "Название продукта не указано." });
    const identity = identityIssue(item); if (identity) issues.push({ ...identity, severity: item.identityStatus === "AMBIGUOUS" && options.failOnAmbiguousIdentity || item.identityStatus === "UNRESOLVED" && options.failOnUnresolvedIdentity ? "ERROR" : identity.severity });
    const hasPreliminary = item.derivedCharacteristics.some(derived => derived.kind === "PRELIMINARY_INFERENCE");
    const rawPreliminaryConfidence = normalizeImportText(item.raw.cells.preliminaryConfidence)?.toUpperCase();
    if (hasPreliminary && rawPreliminaryConfidence && !["LOW", "НИЗКАЯ", "ПРЕДВАРИТЕЛЬНАЯ", "ПРЕДВАРИТЕЛЬНЫЙ"].includes(rawPreliminaryConfidence)) issues.push({ code: "PRELIMINARY_VALUE_WITHOUT_LOW_CONFIDENCE", severity: "ERROR", sheet: item.raw.sheet, rowNumber: item.raw.rowNumber, entityId: item.stagingId, field: "preliminaryValue", originalValue: item.raw.cells.preliminaryValue, message: "Preliminary inference обязан иметь LOW confidence; импортированное значение принудительно ограничено LOW." });
  }
  const knownMixIds = new Set(mixes.map(mix => mix.mixId).filter(Boolean));
  for (const mix of mixes) {
    if (!mix.mixId) issues.push({ code: "MIX_ID_MISSING", severity: "ERROR", sheet: mix.raw.sheet, rowNumber: mix.raw.rowNumber, message: "mixId отсутствует." });
    if (!mix.status) issues.push({ code: "MIX_STATUS_MISSING", severity: "ERROR", sheet: mix.raw.sheet, rowNumber: mix.raw.rowNumber, entityId: mix.mixId, message: "Статус микса отсутствует или неизвестен." });
    if (!mix.sourceUrl && !mix.internalAuthor) issues.push({ code: "SOURCE_MISSING", severity: "WARNING", sheet: mix.raw.sheet, rowNumber: mix.raw.rowNumber, entityId: mix.mixId, message: "Первичный источник микса не указан." });
    if (!components.some(component => component.mixId === mix.mixId)) issues.push({ code: "MIX_COMPONENTS_MISSING", severity: "ERROR", sheet: mix.raw.sheet, rowNumber: mix.raw.rowNumber, entityId: mix.mixId, message: "Для микса не найдены компоненты." });
    if (mix.ratioQuality?.toLocaleLowerCase("en-US") === "inconsistent_source_weights") issues.push({ code: "WEIGHT_SUM_MISMATCH", severity: "WARNING", sheet: mix.raw.sheet, rowNumber: mix.raw.rowNumber, entityId: mix.mixId, field: "ratioQuality", originalValue: mix.ratioQuality, message: "Источник прямо помечает веса компонентов как противоречивые." });
  }
  for (const component of components) {
    if (!knownMixIds.has(component.mixId)) issues.push({ code: "MIX_COMPONENT_ORPHANED", severity: "ERROR", sheet: component.raw.sheet, rowNumber: component.raw.rowNumber, entityId: component.componentId, originalValue: component.mixId, message: "Компонент ссылается на отсутствующий mixId." });
    const identity = identityIssue(component); if (identity) issues.push({ ...identity, severity: component.identityStatus === "AMBIGUOUS" && options.failOnAmbiguousIdentity || component.identityStatus === "UNRESOLVED" && options.failOnUnresolvedIdentity ? "ERROR" : identity.severity });
    for (const [field, parsed] of [["percentage", component.percentage], ["approximatePercentage", component.approximatePercentage], ["parts", component.parts], ["grams", component.grams]] as const) { const original = component.raw.cells[field]; if (original !== null && original !== undefined && original !== "" && parsed === null) issues.push({ code: "INVALID_NUMERIC_CELL", severity: "ERROR", sheet: component.raw.sheet, rowNumber: component.raw.rowNumber, entityId: component.componentId, field, originalValue: original, message: `${field} содержит некорректное числовое значение.` }); }
    for (const [field, value] of [["percentage", component.percentage], ["approximatePercentage", component.approximatePercentage], ["parts", component.parts], ["grams", component.grams]] as const) {
      if (value !== null && value < 0) issues.push({ code: "NEGATIVE_VALUE", severity: "ERROR", sheet: component.raw.sheet, rowNumber: component.raw.rowNumber, entityId: component.componentId, field, originalValue: value, message: `${field} не может быть отрицательным.` });
      if (value !== null && value === 0) issues.push({ code: "ZERO_VALUE", severity: "ERROR", sheet: component.raw.sheet, rowNumber: component.raw.rowNumber, entityId: component.componentId, field, originalValue: value, message: `${field} не может быть нулём.` });
    }
    if ((component.percentage ?? component.approximatePercentage ?? 0) > 100) issues.push({ code: "PROPORTION_INVALID", severity: "ERROR", sheet: component.raw.sheet, rowNumber: component.raw.rowNumber, entityId: component.componentId, field: "percentage", message: "Процент не может превышать 100." });
  }
  for (const mix of mixes) {
    const own = components.filter(component => component.mixId === mix.mixId); const percentages = own.map(component => component.percentage ?? component.approximatePercentage).filter((value): value is number => value !== null);
    if (mix.proportionType === "PERCENT" && percentages.length === own.length && own.length > 0) {
      const total = percentages.reduce((sum, value) => sum + value, 0); const delta = Math.abs(total - 100);
      if (delta > 0.0001 && delta <= options.percentageTolerance) issues.push({ code: "PERCENT_SUM_ROUNDING", severity: "WARNING", sheet: mix.raw.sheet, rowNumber: mix.raw.rowNumber, entityId: mix.mixId, originalValue: total, normalizedValue: 100, message: "Сумма процентов отличается от 100 в пределах допустимого округления." });
      if (delta > options.percentageTolerance) issues.push({ code: "PERCENT_SUM_MISMATCH", severity: "ERROR", sheet: mix.raw.sheet, rowNumber: mix.raw.rowNumber, entityId: mix.mixId, originalValue: total, normalizedValue: 100, message: "Сумма процентов выходит за tolerance." });
    }
    const grams = own.map(component => component.grams).filter((value): value is number => value !== null); if (grams.length > 0 && mix.declaredTotalWeightGrams !== null) { const sum = grams.reduce((total, value) => total + value, 0); if (Math.abs(sum - mix.declaredTotalWeightGrams) > 0.0001) issues.push({ code: "TOTAL_WEIGHT_MISMATCH", severity: "WARNING", sheet: mix.raw.sheet, rowNumber: mix.raw.rowNumber, entityId: mix.mixId, originalValue: mix.declaredTotalWeightGrams, normalizedValue: sum, message: "Заявленный общий вес не равен сумме компонентов." }); }
  }
  return issues;
};
