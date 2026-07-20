import { resolveCatalogTobaccoIdentity } from "../tobacco-product-identity";
import { EXPERT_MIX_KNOWLEDGE_SCHEMA_VERSION } from "./constants";
import { createExpertKnowledgeEvidenceId, createExpertKnowledgeSourceId, createExpertMixComponentId, createExpertMixObservationId, createExpertMixRecordId } from "./ids";
import { normalizeExpertKnowledgeTag, normalizeExpertKnowledgeText } from "./normalizer";
import { validateExpertMixKnowledgeRecord } from "./validator";
import type { CatalogTobaccoIdentityInput } from "../tobacco-product-identity";
import type { AdaptExternalExpertMixResult, ExpertMixComponent, ExpertMixIdentityStatus, ExpertMixKnowledgeRecord, ExpertMixObservation, ExternalExpertMixInput } from "./types";

export const resolveExpertMixComponentIdentity = (component: ExpertMixComponent, identityInput: CatalogTobaccoIdentityInput): ExpertMixComponent => {
  const resolution = resolveCatalogTobaccoIdentity(identityInput);
  const status: ExpertMixIdentityStatus = resolution.status === "RESOLVED" ? "RESOLVED" : resolution.status === "MANUFACTURER_ONLY" ? "MANUFACTURER_ONLY" : resolution.status === "AMBIGUOUS" ? "AMBIGUOUS" : "UNRESOLVED";
  if (resolution.status === "RESOLVED") return { ...component, identityStatus: status, identityConfidence: resolution.confidence, manufacturerId: resolution.manufacturerId, productLineId: resolution.productLineId, canonicalProductName: resolution.productName, canonicalProductId: resolution.productId };
  if (resolution.status === "MANUFACTURER_ONLY") return { ...component, identityStatus: status, identityConfidence: resolution.confidence, manufacturerId: resolution.manufacturerId, ...(resolution.productName ? { canonicalProductName: resolution.productName } : {}) };
  return { ...component, identityStatus: status };
};

export const adaptExternalExpertMixInput = (input: ExternalExpertMixInput): AdaptExternalExpertMixResult => {
  const sourceId = input.source.sourceId ?? createExpertKnowledgeSourceId({ type: input.source.sourceType, label: input.source.internalLabel ?? input.source.publicLabel ?? "anonymous", url: input.source.url ?? null });
  const source = {
    ...input.source,
    sourceId,
    ...(input.source.internalLabel ? { internalLabel: normalizeExpertKnowledgeText(input.source.internalLabel) } : {}),
    ...(input.source.publicLabel ? { publicLabel: normalizeExpertKnowledgeText(input.source.publicLabel) } : {}),
  };
  const components = input.components.map((component, index) => ({
    ...component,
    componentId: component.componentId ?? createExpertMixComponentId({ sourceId, externalId: input.externalId ?? null, position: component.position ?? index + 1, rawProductName: component.rawProductName }),
    position: component.position ?? index + 1,
    rawProductName: component.rawProductName,
    ...(component.canonicalProductName ? { canonicalProductName: normalizeExpertKnowledgeText(component.canonicalProductName) } : {}),
  }));
  const evidence = (input.evidence ?? []).map((item, index) => ({ ...item, evidenceId: item.evidenceId ?? createExpertKnowledgeEvidenceId({ sourceId, externalId: input.externalId ?? null, index, type: item.type, reference: item.reference ?? null }), sourceId }));
  const observations = (input.observations ?? []).map((observation, index) => {
    const current = observation as ExpertMixObservation & { readonly observationId?: string };
    return { ...current, observationId: current.observationId ?? createExpertMixObservationId({ sourceId, externalId: input.externalId ?? null, index, type: current.type, subject: current.subject }) } as ExpertMixObservation;
  });
  const proportions = input.proportions ?? { type: "UNKNOWN" as const };
  const recordSemanticInput = { sourceId, externalId: input.externalId ?? null, components: components.map(item => ({ id: item.canonicalProductId ?? item.rawProductName, position: item.position, proportion: item.proportion ?? null })), proportions };
  const record: ExpertMixKnowledgeRecord = {
    id: createExpertMixRecordId(recordSemanticInput),
    ...(input.title ? { title: normalizeExpertKnowledgeText(input.title) } : {}),
    recordKind: components.length === 1 ? "SINGLE_PRODUCT_SESSION" : "MIX",
    status: input.status ?? "DRAFT",
    components,
    proportions,
    ...(input.preparation ? { preparation: input.preparation } : {}),
    observations,
    ...(input.evaluation ? { evaluation: input.evaluation } : {}),
    source,
    evidence,
    confidence: input.confidence ?? "UNKNOWN",
    tags: [...new Set((input.tags ?? []).map(normalizeExpertKnowledgeTag))],
    ...(input.notes ? { notes: input.notes } : {}),
    schemaVersion: EXPERT_MIX_KNOWLEDGE_SCHEMA_VERSION,
  };
  return validateExpertMixKnowledgeRecord(record);
};
