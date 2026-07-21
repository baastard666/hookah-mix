import { ACTIVE_EXPERT_MIX_RECORD_STATUSES } from "./constants";
import { deepCloneAndFreeze, normalizeExpertKnowledgeTag } from "./normalizer";
import { validateExpertMixKnowledgeRecord } from "./validator";
import type { ExpertKnowledgeSource, ExpertMixKnowledgeRecord, ExpertMixKnowledgeRegistry, ExpertMixRecordStatus } from "./types";

const stable = (records: readonly Readonly<ExpertMixKnowledgeRecord>[]) => [...records].sort((a, b) => a.id.localeCompare(b.id));

export const createExpertMixKnowledgeRegistry = (records: readonly ExpertMixKnowledgeRecord[]): ExpertMixKnowledgeRegistry => {
  const entries = new Map<string, Readonly<ExpertMixKnowledgeRecord>>();
  for (const candidate of records) {
    if (entries.has(candidate.id)) throw new Error(`Duplicate expert mix record ID: ${candidate.id}`);
    const result = validateExpertMixKnowledgeRecord(candidate);
    if (!result.valid) throw new Error(`Invalid expert mix record ${candidate.id}: ${result.errors.map(item => item.code).join(", ")}`);
    entries.set(result.record.id, deepCloneAndFreeze(result.record));
  }
  const list = () => stable([...entries.values()]);
  const registry: ExpertMixKnowledgeRegistry = {
    get: id => entries.get(id) ?? null,
    has: id => entries.has(id),
    list,
    findByProductId: productId => stable(list().filter(record => record.components.some(component => component.canonicalProductId === productId))),
    findByManufacturerId: manufacturerId => stable(list().filter(record => record.components.some(component => component.manufacturerId === manufacturerId))),
    findByStatus: status => stable(list().filter(record => record.status === status)),
    findByTag: tag => { const normalized = normalizeExpertKnowledgeTag(tag); return stable(list().filter(record => record.tags.some(item => normalizeExpertKnowledgeTag(item) === normalized))); },
    listSources: () => {
      const unique = new Map<string, Readonly<ExpertKnowledgeSource>>();
      for (const record of list()) unique.set(record.source.sourceId, record.source);
      return [...unique.values()].sort((a, b) => a.sourceId.localeCompare(b.sourceId));
    },
  };
  return Object.freeze(registry);
};

export const getExpertMixRecord = (registry: ExpertMixKnowledgeRegistry, id: string) => registry.get(id);
export const hasExpertMixRecord = (registry: ExpertMixKnowledgeRegistry, id: string) => registry.has(id);
export const listExpertMixRecords = (registry: ExpertMixKnowledgeRegistry, options?: { readonly active?: boolean }) => options?.active ? registry.list().filter(record => (ACTIVE_EXPERT_MIX_RECORD_STATUSES as readonly ExpertMixRecordStatus[]).includes(record.status)) : registry.list();
export const findExpertMixRecordsByProductId = (registry: ExpertMixKnowledgeRegistry, productId: string) => registry.findByProductId(productId);
export const findExpertMixRecordsByManufacturerId = (registry: ExpertMixKnowledgeRegistry, manufacturerId: string) => registry.findByManufacturerId(manufacturerId);
export const findExpertMixRecordsByStatus = (registry: ExpertMixKnowledgeRegistry, status: ExpertMixRecordStatus) => registry.findByStatus(status);
export const findExpertMixRecordsByTag = (registry: ExpertMixKnowledgeRegistry, tag: string) => registry.findByTag(tag);
export const listExpertMixSources = (registry: ExpertMixKnowledgeRegistry) => registry.listSources();
