import { adaptExternalExpertMixInput, createExpertKnowledgeEvidenceId, createExpertKnowledgeSourceId, toPublicExpertMixKnowledgeRecord } from "../expert-mix-knowledge";
import type { ComponentProportion, ExpertMixComponentRole, ExpertMixKnowledgeRecord, ExternalExpertMixInput, MixProportions } from "../expert-mix-knowledge";
import type { ExpertMixImportIssue, ExpertMixImportOptions, NormalizedMixComponentStagingRecord, NormalizedMixStagingRecord } from "./types";

const roles: readonly ExpertMixComponentRole[] = ["BASE", "ACCENT", "SUPPORT", "COOLING", "SWEETENER", "SPICE", "TEXTURE", "UNKNOWN"];
export const mapStagingMixToKnowledgeRecord = (mix: NormalizedMixStagingRecord, components: readonly NormalizedMixComponentStagingRecord[], options: ExpertMixImportOptions, importIssues: readonly ExpertMixImportIssue[]): { readonly record: ExpertMixKnowledgeRecord | null; readonly issues: readonly ExpertMixImportIssue[] } => {
  const issues: ExpertMixImportIssue[] = []; const own = components.filter(component => component.mixId === mix.mixId).sort((a, b) => a.position - b.position);
  const hasRounding = importIssues.some(issue => issue.entityId === mix.mixId && issue.code === "PERCENT_SUM_ROUNDING"); const hasInvalidMeasurement = importIssues.some(issue => issue.entityId === mix.mixId && ["PERCENT_SUM_MISMATCH", "TOTAL_WEIGHT_MISMATCH"].includes(issue.code));
  let proportions: MixProportions = { type: mix.proportionType } as MixProportions;
  if (mix.proportionType === "PERCENT" && hasRounding) proportions = { type: "PERCENT", tolerance: options.percentageTolerance };
  if (mix.proportionType === "PARTS") proportions = { type: "PARTS", totalParts: own.reduce((sum, item) => sum + (item.parts ?? 0), 0) || undefined };
  const mappedComponents = own.map(component => {
    let proportion: ComponentProportion | undefined;
    if (mix.proportionType === "PERCENT" && component.approximatePercentage !== null) proportion = { type: "APPROXIMATE_PERCENT", value: component.approximatePercentage, tolerance: options.percentageTolerance };
    else if (mix.proportionType === "PERCENT" && component.percentage !== null) proportion = hasRounding ? { type: "APPROXIMATE_PERCENT", value: component.percentage, tolerance: options.percentageTolerance } : { type: "PERCENT", value: component.percentage };
    else if (mix.proportionType === "PARTS" && component.parts !== null) proportion = { type: "PARTS", value: component.parts };
    else if (mix.proportionType === "UNKNOWN") proportion = { type: "UNKNOWN" };
    const role = component.role?.toUpperCase() as ExpertMixComponentRole | undefined;
    return { componentId: component.componentId, position: component.position, rawProductName: component.displayName, ...(component.canonicalProductId ? { canonicalProductId: component.canonicalProductId } : {}), ...(component.manufacturerId ? { manufacturerId: component.manufacturerId } : {}), ...(component.productLineId ? { productLineId: component.productLineId } : {}), ...(component.productName ? { canonicalProductName: component.productName } : {}), identityStatus: component.identityStatus, ...(proportion ? { proportion } : {}), ...(role && roles.includes(role) ? { role, roleOrigin: "SOURCE_STATED" as const } : {}), ...(component.grams !== null ? { notes: `Исходный вес: ${component.grams} г` } : {}) };
  });
  const sourceId = createExpertKnowledgeSourceId({ workbook: mix.raw.sheet, mixId: mix.mixId, url: mix.sourceUrl, author: mix.internalAuthor });
  const evidence = [] as NonNullable<ExternalExpertMixInput["evidence"]>[number][]; const observations = [] as NonNullable<ExternalExpertMixInput["observations"]>[number][];
  if (mix.observation) { const evidenceId = createExpertKnowledgeEvidenceId({ sourceId, mixId: mix.mixId, type: "observation" }); evidence.push({ evidenceId, type: "DIRECT_STATEMENT", confidence: "MEDIUM", summary: "Наблюдение из Excel", excerpt: options.includePrivateEvidence ? mix.observation : undefined }); observations.push({ type: "FREEFORM", subject: { type: "MIX" }, origin: "SOURCE_STATED", confidence: "MEDIUM", evidenceIds: [evidenceId], text: mix.observation }); }
  let evaluation: ExternalExpertMixInput["evaluation"];
  if (mix.rating && options.includeExternalRatings && [5, 10, 100].includes(mix.rating.originalScale)) { const evidenceId = createExpertKnowledgeEvidenceId({ sourceId, mixId: mix.mixId, type: "rating" }); evidence.push({ evidenceId, type: "RATING", confidence: mix.rating.confidence, summary: `Внешний агрегированный рейтинг; sampleSize=${mix.rating.sampleSize ?? "unknown"}` }); const scale = mix.rating.originalScale as 5 | 10 | 100; evaluation = { verdict: "UNKNOWN", rating: { scale, value: mix.rating.originalValue }, evidenceIds: [evidenceId] }; }
  const requestedStatus = mix.status ?? "DRAFT"; const status = requestedStatus === "VERIFIED" && hasInvalidMeasurement ? "PARTIALLY_VERIFIED" : requestedStatus;
  const external: ExternalExpertMixInput = { externalId: mix.mixId, ...(mix.title ? { title: mix.title } : {}), status, components: mappedComponents, source: { sourceId, sourceType: mix.internalAuthor || mix.sourceUrl ? "EXPERT_REVIEW" : "INTERNAL_TEST", internalLabel: mix.internalAuthor ?? `Excel row ${mix.raw.rowNumber}`, publicLabel: "Проверенный обзор", ...(mix.sourceUrl ? { url: mix.sourceUrl } : {}), authorVisibility: "INTERNAL_ONLY" }, proportions, observations, ...(evaluation ? { evaluation } : {}), evidence, confidence: status === "VERIFIED" ? "HIGH" : status === "PARTIALLY_VERIFIED" ? "MEDIUM" : "LOW", tags: mix.tags, notes: `Imported from ${mix.raw.sheet}; row ${mix.raw.rowNumber}` };
  const result = adaptExternalExpertMixInput(external);
  if (!result.valid) { issues.push({ code: "DOMAIN_VALIDATION_FAILED", severity: "ERROR", sheet: mix.raw.sheet, rowNumber: mix.raw.rowNumber, entityId: mix.mixId, message: result.errors.map(error => error.code).join(", ") }); return { record: null, issues }; }
  if (status === "ARCHIVED" && !options.includeArchived || status === "REJECTED" && !options.includeRejected) return { record: null, issues };
  return { record: result.record, issues };
};
export const mapKnowledgeRecordsToPublic = (records: readonly ExpertMixKnowledgeRecord[]) => records.map(toPublicExpertMixKnowledgeRecord);
