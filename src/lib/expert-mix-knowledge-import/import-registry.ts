import { createExpertMixKnowledgeRegistry } from "../expert-mix-knowledge";
import { deepCloneAndFreeze } from "./normalizer";
import type { ExpertMixImportReport, ImportedExpertMixRegistry, NormalizedTobaccoStagingRecord } from "./types";
import type { ExpertMixKnowledgeRecord } from "../expert-mix-knowledge";

export const createImportedExpertMixRegistry = (records: readonly ExpertMixKnowledgeRecord[], tobacco: readonly NormalizedTobaccoStagingRecord[], report: ExpertMixImportReport): ImportedExpertMixRegistry => {
  const knowledge = createExpertMixKnowledgeRegistry(records);
  return deepCloneAndFreeze({ records: knowledge.list(), tobacco, report });
};
