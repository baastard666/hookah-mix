import { deepCloneAndFreeze } from "./normalizer";
import type { ExpertKnowledgeSource, ExpertKnowledgeSourceType, ExpertMixKnowledgeRecord, PublicExpertMixKnowledgeRecord } from "./types";

const sourceLabels: Record<ExpertKnowledgeSourceType, string> = {
  VIDEO: "Экспертный видеоисточник", ARTICLE: "Проверенный обзор", SOCIAL_POST: "Пользовательское наблюдение",
  RETAILER: "Материал продавца", MANUFACTURER: "Материал производителя", EXPERT_REVIEW: "Проверенный обзор",
  INTERNAL_TEST: "Внутренний тест", USER_FEEDBACK: "Пользовательское наблюдение", OTHER: "Обезличенный источник",
};
const publicSource = (source: ExpertKnowledgeSource) => ({
  sourceType: source.sourceType,
  label: source.publicLabel && source.authorVisibility === "PUBLIC_ALLOWED" ? source.publicLabel : sourceLabels[source.sourceType],
  ...(source.url && source.authorVisibility === "PUBLIC_ALLOWED" ? { url: source.url } : {}),
  ...(source.publishedAt ? { publishedAt: source.publishedAt } : {}),
  ...(source.language ? { language: source.language } : {}),
  authorVisibility: source.authorVisibility,
});

export const toPublicExpertMixKnowledgeRecord = (record: ExpertMixKnowledgeRecord): PublicExpertMixKnowledgeRecord => {
  const { source, evidence: _evidence, notes: _notes, ...safeRecord } = record;
  void _evidence; void _notes;
  const components = safeRecord.components.map(({ notes: _componentNotes, ...component }) => { void _componentNotes; return component; });
  const observations = safeRecord.observations.map(({ notes: _observationNotes, evidenceIds: _evidenceIds, ...observation }) => { void _observationNotes; void _evidenceIds; return observation; });
  const preparation = safeRecord.preparation ? (() => { const { notes: _preparationNotes, ...value } = safeRecord.preparation; void _preparationNotes; return value; })() : undefined;
  const evaluation = safeRecord.evaluation ? (() => { const { evidenceIds: _evidenceIds, ...value } = safeRecord.evaluation; void _evidenceIds; return value; })() : undefined;
  return deepCloneAndFreeze({ ...safeRecord, components, observations, ...(preparation ? { preparation } : {}), ...(evaluation ? { evaluation } : {}), source: publicSource(source) });
};
