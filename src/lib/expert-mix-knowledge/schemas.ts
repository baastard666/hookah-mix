import { EXPERT_EVIDENCE_TYPES, EXPERT_KNOWLEDGE_CONFIDENCE_LEVELS, EXPERT_MIX_IDENTITY_STATUSES, EXPERT_MIX_RECORD_STATUSES, EXPERT_SOURCE_TYPES, KNOWLEDGE_ORIGINS } from "./constants";

export const isOneOf = <T extends string>(value: unknown, values: readonly T[]): value is T => typeof value === "string" && values.includes(value as T);
export const isExpertMixRecordStatus = (value: unknown) => isOneOf(value, EXPERT_MIX_RECORD_STATUSES);
export const isExpertMixIdentityStatus = (value: unknown) => isOneOf(value, EXPERT_MIX_IDENTITY_STATUSES);
export const isExpertKnowledgeConfidence = (value: unknown) => isOneOf(value, EXPERT_KNOWLEDGE_CONFIDENCE_LEVELS);
export const isKnowledgeOrigin = (value: unknown) => isOneOf(value, KNOWLEDGE_ORIGINS);
export const isExpertSourceType = (value: unknown) => isOneOf(value, EXPERT_SOURCE_TYPES);
export const isExpertEvidenceType = (value: unknown) => isOneOf(value, EXPERT_EVIDENCE_TYPES);
export const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
export const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
